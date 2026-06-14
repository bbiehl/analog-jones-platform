import { inject, Injectable } from '@angular/core';
import type { DocumentData, DocumentReference, QueryDocumentSnapshot } from 'firebase/firestore';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { Genre } from './genre.model';

// Firestore caps a write batch at 500 operations.
const MAX_BATCH = 500;

@Injectable({ providedIn: 'root' })
export class GenreService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async getAllGenres(): Promise<Genre[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'genres'),
      this.ops.orderBy('name'),
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

  /**
   * Update the genre doc, then propagate the new name/slug into the
   * denormalized copy embedded on every episode that references it.
   */
  async updateGenre(id: string, genre: Partial<Genre>): Promise<void> {
    const { id: _id, ...data } = genre as Genre;
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'genres', id), data);

    const updated = await this.getGenreById(id);
    await this.rewriteAcrossEpisodes(id, (current) =>
      current.map((g) => (g.id === id ? updated : g)),
    );
  }

  /**
   * Delete the genre, removing its embedded copy from every episode first.
   */
  async deleteGenre(id: string): Promise<void> {
    await this.rewriteAcrossEpisodes(id, (current) => current.filter((g) => g.id !== id));

    const batch = this.ops.writeBatch(this.firestore);
    batch.delete(this.ops.doc(this.firestore, 'genres', id));
    await batch.commit();
  }

  /**
   * Set the exact set of episodes that carry this genre: add the embedded
   * object to selected episodes that lack it and remove it from episodes no
   * longer selected. Replaces the former episodeGenres junction bulk-edit.
   */
  async setEpisodesForGenre(genre: Genre, episodeIds: string[]): Promise<void> {
    if (!genre.id) return;
    const target = new Set(episodeIds);
    const docs = await this.getEpisodeDocs();
    const updates: { ref: DocumentReference; genres: Genre[] }[] = [];

    for (const d of docs) {
      const current = this.readGenres(d);
      const has = current.some((g) => g.id === genre.id);
      const shouldHave = target.has(d.id);
      if (shouldHave && !has) {
        updates.push({ ref: d.ref, genres: [...current, genre] });
      } else if (!shouldHave && has) {
        updates.push({ ref: d.ref, genres: current.filter((g) => g.id !== genre.id) });
      }
    }
    await this.commitInChunks(updates);
  }

  /** Apply `buildNext` to the embedded genres of every episode that references `id`. */
  private async rewriteAcrossEpisodes(
    id: string,
    buildNext: (current: Genre[]) => Genre[],
  ): Promise<void> {
    const docs = await this.getEpisodeDocs();
    const updates: { ref: DocumentReference; genres: Genre[] }[] = [];
    for (const d of docs) {
      const current = this.readGenres(d);
      if (!current.some((g) => g.id === id)) continue;
      updates.push({ ref: d.ref, genres: buildNext(current) });
    }
    await this.commitInChunks(updates);
  }

  private readGenres(doc: QueryDocumentSnapshot<DocumentData>): Genre[] {
    return (doc.data()['genres'] as Genre[] | undefined) ?? [];
  }

  private async getEpisodeDocs(): Promise<QueryDocumentSnapshot<DocumentData>[]> {
    const snapshot = await this.ops.getDocs(this.ops.collection(this.firestore, 'episodes'));
    return snapshot.docs;
  }

  private async commitInChunks(
    updates: { ref: DocumentReference; genres: Genre[] }[],
  ): Promise<void> {
    for (let i = 0; i < updates.length; i += MAX_BATCH) {
      const batch = this.ops.writeBatch(this.firestore);
      for (const u of updates.slice(i, i + MAX_BATCH)) {
        batch.update(u.ref, { genres: u.genres });
      }
      await batch.commit();
    }
  }
}
