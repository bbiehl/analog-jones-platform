import { inject, Injectable } from '@angular/core';
import type { DocumentData, DocumentReference, QueryDocumentSnapshot } from 'firebase/firestore';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { Category } from './category.model';

// Firestore caps a write batch at 500 operations.
const MAX_BATCH = 500;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async getAllCategories(): Promise<Category[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'categories'),
      this.ops.orderBy('name'),
    );
    const snapshot = await this.ops.getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
  }

  async getCategoryById(id: string): Promise<Category> {
    const snap = await this.ops.getDoc(this.ops.doc(this.firestore, 'categories', id));
    if (!snap.exists()) {
      throw new Error(`Category with id "${id}" not found`);
    }
    return { id: snap.id, ...snap.data() } as Category;
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    const docRef = await this.ops.addDoc(this.ops.collection(this.firestore, 'categories'), {
      name: category.name,
      slug: category.slug,
    });
    return docRef.id;
  }

  /**
   * Update the category doc, then propagate the new name/slug into the
   * denormalized copy embedded on every episode that references it.
   */
  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const { id: _id, ...data } = category as Category;
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'categories', id), data);

    const updated = await this.getCategoryById(id);
    await this.rewriteAcrossEpisodes(id, (current) =>
      current.map((c) => (c.id === id ? updated : c)),
    );
  }

  /**
   * Delete the category, removing its embedded copy from every episode first.
   */
  async deleteCategory(id: string): Promise<void> {
    await this.rewriteAcrossEpisodes(id, (current) => current.filter((c) => c.id !== id));

    const batch = this.ops.writeBatch(this.firestore);
    batch.delete(this.ops.doc(this.firestore, 'categories', id));
    await batch.commit();
  }

  /**
   * Set the exact set of episodes that carry this category: add the embedded
   * object to selected episodes that lack it and remove it from episodes no
   * longer selected. Replaces the former episodeCategories junction bulk-edit.
   */
  async setEpisodesForCategory(category: Category, episodeIds: string[]): Promise<void> {
    if (!category.id) return;
    const target = new Set(episodeIds);
    const docs = await this.getEpisodeDocs();
    const updates: { ref: DocumentReference; categories: Category[] }[] = [];

    for (const d of docs) {
      const current = this.readCategories(d);
      const has = current.some((c) => c.id === category.id);
      const shouldHave = target.has(d.id);
      if (shouldHave && !has) {
        updates.push({ ref: d.ref, categories: [...current, category] });
      } else if (!shouldHave && has) {
        updates.push({ ref: d.ref, categories: current.filter((c) => c.id !== category.id) });
      }
    }
    await this.commitInChunks(updates);
  }

  /** Apply `buildNext` to the embedded categories of every episode that references `id`. */
  private async rewriteAcrossEpisodes(
    id: string,
    buildNext: (current: Category[]) => Category[],
  ): Promise<void> {
    const docs = await this.getEpisodeDocs();
    const updates: { ref: DocumentReference; categories: Category[] }[] = [];
    for (const d of docs) {
      const current = this.readCategories(d);
      if (!current.some((c) => c.id === id)) continue;
      updates.push({ ref: d.ref, categories: buildNext(current) });
    }
    await this.commitInChunks(updates);
  }

  private readCategories(doc: QueryDocumentSnapshot<DocumentData>): Category[] {
    return (doc.data()['categories'] as Category[] | undefined) ?? [];
  }

  private async getEpisodeDocs(): Promise<QueryDocumentSnapshot<DocumentData>[]> {
    const snapshot = await this.ops.getDocs(this.ops.collection(this.firestore, 'episodes'));
    return snapshot.docs;
  }

  private async commitInChunks(
    updates: { ref: DocumentReference; categories: Category[] }[],
  ): Promise<void> {
    for (let i = 0; i < updates.length; i += MAX_BATCH) {
      const batch = this.ops.writeBatch(this.firestore);
      for (const u of updates.slice(i, i + MAX_BATCH)) {
        batch.update(u.ref, { categories: u.categories });
      }
      await batch.commit();
    }
  }
}
