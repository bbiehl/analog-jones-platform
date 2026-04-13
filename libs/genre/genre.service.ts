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
import { EpisodeGenreService } from '../shared/episode-genre.service';
import { Genre, GenreWithRelations } from './genre.model';

@Injectable({ providedIn: 'root' })
export class GenreService {
  private firestore = inject(FIRESTORE);
  private episodeGenreService = inject(EpisodeGenreService);

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

  async getGenreBySlug(slug: string): Promise<GenreWithRelations> {
    const q = query(collection(this.firestore, 'genres'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error(`Genre with slug "${slug}" not found`);
    }

    const genreDoc = snapshot.docs[0];
    const episodes = await this.episodeGenreService.getEpisodesByGenreSlug(slug);
    return { id: genreDoc.id, ...genreDoc.data(), episodes } as GenreWithRelations;
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
    await this.episodeGenreService.deleteEpisodeGenresByGenreId(id);
    await deleteDoc(doc(this.firestore, 'genres', id));
  }
}
