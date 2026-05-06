import { inject, Injectable } from '@angular/core';
import { Category } from '../category/category.model';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';

@Injectable({ providedIn: 'root' })
export class EpisodeCategoryService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async createEpisodeCategory(episodeId: string, categoryId: string): Promise<void> {
    await this.ops.addDoc(this.ops.collection(this.firestore, 'episodeCategories'), {
      episodeId,
      categoryId,
    });
  }

  async deleteEpisodeCategory(episodeId: string, categoryId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeCategories'),
      this.ops.where('episodeId', '==', episodeId),
      this.ops.where('categoryId', '==', categoryId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeCategoriesByCategoryId(categoryId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeCategories'),
      this.ops.where('categoryId', '==', categoryId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeCategoriesByEpisodeId(episodeId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeCategories'),
      this.ops.where('episodeId', '==', episodeId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async getEpisodeIdsByCategoryId(categoryId: string): Promise<string[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeCategories'),
      this.ops.where('categoryId', '==', categoryId)
    );
    const snapshot = await this.ops.getDocs(q);
    return Array.from(new Set(snapshot.docs.map((d) => d.data()['episodeId'] as string)));
  }

  async setEpisodesForCategory(categoryId: string, episodeIds: string[]): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeCategories'),
      this.ops.where('categoryId', '==', categoryId)
    );
    const snapshot = await this.ops.getDocs(q);

    const desired = new Set(episodeIds);
    const existing = new Map<string, (typeof snapshot.docs)[number]['ref'][]>();
    for (const d of snapshot.docs) {
      const episodeId = d.data()['episodeId'] as string;
      const refs = existing.get(episodeId) ?? [];
      refs.push(d.ref);
      existing.set(episodeId, refs);
    }

    const batch = this.ops.writeBatch(this.firestore);
    for (const [episodeId, refs] of existing) {
      if (!desired.has(episodeId)) {
        for (const ref of refs) batch.delete(ref);
      } else {
        for (let i = 1; i < refs.length; i++) batch.delete(refs[i]);
      }
    }
    for (const episodeId of desired) {
      if (!existing.has(episodeId)) {
        batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeCategories')), {
          episodeId,
          categoryId,
        });
      }
    }
    await batch.commit();
  }

  async getEpisodeCategoriesByEpisodeId(episodeId: string): Promise<Category[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeCategories'),
      this.ops.where('episodeId', '==', episodeId)
    );
    const snapshot = await this.ops.getDocs(q);
    const categories: Category[] = [];

    for (const junction of snapshot.docs) {
      const categoryId = junction.data()['categoryId'];
      const categorySnap = await this.ops.getDoc(
        this.ops.doc(this.firestore, 'categories', categoryId)
      );
      if (categorySnap.exists()) {
        categories.push({ id: categorySnap.id, ...categorySnap.data() } as Category);
      }
    }

    return categories;
  }}
