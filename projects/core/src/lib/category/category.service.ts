import { inject, Injectable } from '@angular/core';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { Category } from './category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async getAllCategories(): Promise<Category[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'categories'),
      this.ops.orderBy('name')
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

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const { id: _id, ...data } = category as Category;
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'categories', id), data);
  }

  async deleteCategory(id: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeCategories'),
      this.ops.where('categoryId', '==', id)
    );
    const snapshot = await this.ops.getDocs(q);

    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(this.ops.doc(this.firestore, 'categories', id));
    await batch.commit();
  }
}
