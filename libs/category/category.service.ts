import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../shared/episode-category.service';
import { Category, CategoryWithRelations } from './category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(FIRESTORE);
  private episodeCategoryService = inject(EpisodeCategoryService);

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

  async getCategoryBySlug(slug: string): Promise<CategoryWithRelations> {
    const q = query(collection(this.firestore, 'categories'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error(`Category with slug "${slug}" not found`);
    }

    const categoryDoc = snapshot.docs[0];
    const episodes = await this.episodeCategoryService.getEpisodesByCategorySlug(slug);
    return { id: categoryDoc.id, ...categoryDoc.data(), episodes } as CategoryWithRelations;
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
    await this.episodeCategoryService.deleteEpisodeCategoriesByCategoryId(id);
    await deleteDoc(doc(this.firestore, 'categories', id));
  }
}
