import { inject, Injectable } from '@angular/core';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { Tag } from './tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async getAllTags(): Promise<Tag[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'tags'),
      this.ops.orderBy('name')
    );
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

  async updateTag(id: string, tag: Partial<Tag>): Promise<void> {
    const { id: _id, ...data } = tag as Tag;
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'tags', id), data);
  }

  async deleteTag(id: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('tagId', '==', id)
    );
    const snapshot = await this.ops.getDocs(q);

    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(this.ops.doc(this.firestore, 'tags', id));
    await batch.commit();
  }
}
