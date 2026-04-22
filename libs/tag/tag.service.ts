import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE } from '../shared/firebase.token';
import { Tag } from './tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private firestore = inject(FIRESTORE);

  async getAllTags(): Promise<Tag[]> {
    const q = query(collection(this.firestore, 'tags'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tag);
  }

  async getTagById(id: string): Promise<Tag> {
    const snap = await getDoc(doc(this.firestore, 'tags', id));
    if (!snap.exists()) {
      throw new Error(`Tag with id "${id}" not found`);
    }
    return { id: snap.id, ...snap.data() } as Tag;
  }

  async createTag(tag: Omit<Tag, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'tags'), {
      name: tag.name,
      slug: tag.slug,
    });
    return docRef.id;
  }

  async updateTag(id: string, tag: Partial<Tag>): Promise<void> {
    const { id: _id, ...data } = tag as Tag;
    await updateDoc(doc(this.firestore, 'tags', id), data);
  }

  async deleteTag(id: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeTags'),
      where('tagId', '==', id)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(this.firestore, 'tags', id));
    await batch.commit();
  }
}
