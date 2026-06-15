import { inject, Injectable } from '@angular/core';
import type { DocumentData, DocumentReference, QueryDocumentSnapshot } from 'firebase/firestore';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { Tag } from './tag.model';

// Firestore caps a write batch at 500 operations.
const MAX_BATCH = 500;

@Injectable({ providedIn: 'root' })
export class TagService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async getAllTags(): Promise<Tag[]> {
    const q = this.ops.query(this.ops.collection(this.firestore, 'tags'), this.ops.orderBy('name'));
    const snapshot = await this.ops.getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tag);
  }

  async getTagById(id: string): Promise<Tag> {
    const snap = await this.ops.getDoc(this.ops.doc(this.firestore, 'tags', id));
    if (!snap.exists()) {
      throw new Error(`Tag with id "${id}" not found`);
    }
    return { id: snap.id, ...snap.data() } as Tag;
  }

  async createTag(tag: Omit<Tag, 'id'>): Promise<string> {
    const docRef = await this.ops.addDoc(this.ops.collection(this.firestore, 'tags'), {
      name: tag.name,
      slug: tag.slug,
    });
    return docRef.id;
  }

  /**
   * Update the tag doc, then propagate the new name/slug into the
   * denormalized copy embedded on every episode that references it.
   */
  async updateTag(id: string, tag: Partial<Tag>): Promise<void> {
    const { id: _id, ...data } = tag as Tag;
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'tags', id), data);

    const updated = await this.getTagById(id);
    await this.rewriteAcrossEpisodes(id, (current) =>
      current.map((t) => (t.id === id ? updated : t)),
    );
  }

  /**
   * Delete the tag, removing its embedded copy from every episode first.
   */
  async deleteTag(id: string): Promise<void> {
    await this.rewriteAcrossEpisodes(id, (current) => current.filter((t) => t.id !== id));

    const batch = this.ops.writeBatch(this.firestore);
    batch.delete(this.ops.doc(this.firestore, 'tags', id));
    await batch.commit();
  }

  /**
   * Set the exact set of episodes that carry this tag: add the embedded object
   * to selected episodes that lack it and remove it from episodes no longer
   * selected. Replaces the former episodeTags junction bulk-edit.
   */
  async setEpisodesForTag(tag: Tag, episodeIds: string[]): Promise<void> {
    if (!tag.id) return;
    const target = new Set(episodeIds);
    const docs = await this.getEpisodeDocs();
    const updates: { ref: DocumentReference; tags: Tag[] }[] = [];

    for (const d of docs) {
      const current = this.readTags(d);
      const has = current.some((t) => t.id === tag.id);
      const shouldHave = target.has(d.id);
      if (shouldHave && !has) {
        updates.push({ ref: d.ref, tags: [...current, tag] });
      } else if (!shouldHave && has) {
        updates.push({ ref: d.ref, tags: current.filter((t) => t.id !== tag.id) });
      }
    }
    await this.commitInChunks(updates);
  }

  /** Apply `buildNext` to the embedded tags of every episode that references `id`. */
  private async rewriteAcrossEpisodes(
    id: string,
    buildNext: (current: Tag[]) => Tag[],
  ): Promise<void> {
    const docs = await this.getEpisodeDocs();
    const updates: { ref: DocumentReference; tags: Tag[] }[] = [];
    for (const d of docs) {
      const current = this.readTags(d);
      if (!current.some((t) => t.id === id)) continue;
      updates.push({ ref: d.ref, tags: buildNext(current) });
    }
    await this.commitInChunks(updates);
  }

  private readTags(doc: QueryDocumentSnapshot<DocumentData>): Tag[] {
    return (doc.data()['tags'] as Tag[] | undefined) ?? [];
  }

  private async getEpisodeDocs(): Promise<QueryDocumentSnapshot<DocumentData>[]> {
    const snapshot = await this.ops.getDocs(this.ops.collection(this.firestore, 'episodes'));
    return snapshot.docs;
  }

  private async commitInChunks(updates: { ref: DocumentReference; tags: Tag[] }[]): Promise<void> {
    for (let i = 0; i < updates.length; i += MAX_BATCH) {
      const batch = this.ops.writeBatch(this.firestore);
      for (const u of updates.slice(i, i + MAX_BATCH)) {
        batch.update(u.ref, { tags: u.tags });
      }
      await batch.commit();
    }
  }
}
