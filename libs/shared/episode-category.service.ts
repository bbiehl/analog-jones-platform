import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Category } from '../category/category.model';
import { Episode } from '../episode/episode.model';
import { FIRESTORE } from './firebase.token';

@Injectable({ providedIn: 'root' })
export class EpisodeCategoryService {
  private firestore = inject(FIRESTORE);

  async createEpisodeCategory(episodeId: string, categoryId: string): Promise<void> {
    await addDoc(collection(this.firestore, 'episodeCategories'), { episodeId, categoryId });
  }

  async deleteEpisodeCategory(episodeId: string, categoryId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeCategories'),
      where('episodeId', '==', episodeId),
      where('categoryId', '==', categoryId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeCategoriesByCategoryId(categoryId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeCategories'),
      where('categoryId', '==', categoryId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeCategoriesByEpisodeId(episodeId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeCategories'),
      where('episodeId', '==', episodeId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async getEpisodeCategoriesByEpisodeId(episodeId: string): Promise<Category[]> {
    const q = query(
      collection(this.firestore, 'episodeCategories'),
      where('episodeId', '==', episodeId)
    );
    const snapshot = await getDocs(q);
    const categories: Category[] = [];

    for (const junction of snapshot.docs) {
      const categoryId = junction.data()['categoryId'];
      const categorySnap = await getDoc(doc(this.firestore, 'categories', categoryId));
      if (categorySnap.exists()) {
        categories.push({ id: categorySnap.id, ...categorySnap.data() } as Category);
      }
    }

    return categories;
  }

  async getEpisodesByCategorySlug(slug: string): Promise<Episode[]> {
    const categoryQuery = query(
      collection(this.firestore, 'categories'),
      where('slug', '==', slug)
    );
    const categorySnapshot = await getDocs(categoryQuery);
    if (categorySnapshot.empty) {
      return [];
    }

    const categoryId = categorySnapshot.docs[0].id;
    const junctionQuery = query(
      collection(this.firestore, 'episodeCategories'),
      where('categoryId', '==', categoryId)
    );
    const junctionSnapshot = await getDocs(junctionQuery);
    const episodes: Episode[] = [];

    for (const junction of junctionSnapshot.docs) {
      const episodeId = junction.data()['episodeId'];
      const episodeSnap = await getDoc(doc(this.firestore, 'episodes', episodeId));
      if (episodeSnap.exists() && episodeSnap.data()['isVisible']) {
        episodes.push({ id: episodeSnap.id, ...episodeSnap.data() } as Episode);
      }
    }

    return episodes;
  }
}
