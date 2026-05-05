import { inject, Injectable } from '@angular/core';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { Genre } from './genre.model';

@Injectable({ providedIn: 'root' })
export class GenreService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async getAllGenres(): Promise<Genre[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'genres'),
      this.ops.orderBy('name')
    );
    const snapshot = await this.ops.getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Genre);
  }

  async getGenreById(id: string): Promise<Genre> {
    const snap = await this.ops.getDoc(this.ops.doc(this.firestore, 'genres', id));
    if (!snap.exists()) {
      throw new Error(`Genre with id "${id}" not found`);
    }
    return { id: snap.id, ...snap.data() } as Genre;
  }

  async createGenre(genre: Omit<Genre, 'id'>): Promise<string> {
    const docRef = await this.ops.addDoc(this.ops.collection(this.firestore, 'genres'), {
      name: genre.name,
      slug: genre.slug,
    });
    return docRef.id;
  }

  async updateGenre(id: string, genre: Partial<Genre>): Promise<void> {
    const { id: _id, ...data } = genre as Genre;
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'genres', id), data);
  }

  async deleteGenre(id: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('genreId', '==', id)
    );
    const snapshot = await this.ops.getDocs(q);

    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(this.ops.doc(this.firestore, 'genres', id));
    await batch.commit();
  }
}
