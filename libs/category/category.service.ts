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
import { Category } from './category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(FIRESTORE);

  async getAllCategories(): Promise<Category[]> {
    const q = query(collection(this.firestore, 'categories'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
  }

  async getCategoryById(id: string): Promise<Category> {
    const snap = await getDoc(doc(this.firestore, 'categories', id));
    if (!snap.exists()) {
      throw new Error(`Category with id "${id}" not found`);
    }
    return { id: snap.id, ...snap.data() } as Category;
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'categories'), {
      name: category.name,
      slug: category.slug,
    });
    return docRef.id;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const { id: _id, ...data } = category as Category;
    await updateDoc(doc(this.firestore, 'categories', id), data);
  }

  async deleteCategory(id: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeCategories'),
      where('categoryId', '==', id)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(this.firestore, 'categories', id));
    await batch.commit();
  }
}
