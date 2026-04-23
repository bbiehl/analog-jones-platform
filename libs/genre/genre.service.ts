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
import { Genre } from './genre.model';

@Injectable({ providedIn: 'root' })
export class GenreService {
  private firestore = inject(FIRESTORE);

  async getAllGenres(): Promise<Genre[]> {
    const q = query(collection(this.firestore, 'genres'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Genre);
  }

  async getGenreById(id: string): Promise<Genre> {
    const snap = await getDoc(doc(this.firestore, 'genres', id));
    if (!snap.exists()) {
      throw new Error(`Genre with id "${id}" not found`);
    }
    return { id: snap.id, ...snap.data() } as Genre;
  }

  async createGenre(genre: Omit<Genre, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'genres'), {
      name: genre.name,
      slug: genre.slug,
    });
    return docRef.id;
  }

  async updateGenre(id: string, genre: Partial<Genre>): Promise<void> {
    const { id: _id, ...data } = genre as Genre;
    await updateDoc(doc(this.firestore, 'genres', id), data);
  }

  async deleteGenre(id: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeGenres'),
      where('genreId', '==', id)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(this.firestore, 'genres', id));
    await batch.commit();
  }
}
