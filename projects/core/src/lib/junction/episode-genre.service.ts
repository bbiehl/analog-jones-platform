import { inject, Injectable } from '@angular/core';
import { Episode } from '../episode/episode.model';
import { Genre } from '../genre/genre.model';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';

@Injectable({ providedIn: 'root' })
export class EpisodeGenreService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async createEpisodeGenre(episodeId: string, genreId: string): Promise<void> {
    await this.ops.addDoc(this.ops.collection(this.firestore, 'episodeGenres'), {
      episodeId,
      genreId,
    });
  }

  async deleteEpisodeGenre(episodeId: string, genreId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('episodeId', '==', episodeId),
      this.ops.where('genreId', '==', genreId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeGenresByEpisodeId(episodeId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('episodeId', '==', episodeId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeGenresByGenreId(genreId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('genreId', '==', genreId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async getEpisodeIdsByGenreId(genreId: string): Promise<string[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('genreId', '==', genreId)
    );
    const snapshot = await this.ops.getDocs(q);
    return Array.from(new Set(snapshot.docs.map((d) => d.data()['episodeId'] as string)));
  }

  async setEpisodesForGenre(genreId: string, episodeIds: string[]): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('genreId', '==', genreId)
    );
    const snapshot = await this.ops.getDocs(q);

    const desired = new Set(episodeIds);
    const existing = new Map<string, (typeof snapshot.docs)[number]['ref'][]>();
    for (const d of snapshot.docs) {
      const episodeId = d.data()['episodeId'] as string;
      const refs = existing.get(episodeId) ?? [];
      refs.push(d.ref);
      existing.set(episodeId, refs);
    }

    const batch = this.ops.writeBatch(this.firestore);
    for (const [episodeId, refs] of existing) {
      if (!desired.has(episodeId)) {
        for (const ref of refs) batch.delete(ref);
      } else {
        for (let i = 1; i < refs.length; i++) batch.delete(refs[i]);
      }
    }
    for (const episodeId of desired) {
      if (!existing.has(episodeId)) {
        batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeGenres')), {
          episodeId,
          genreId,
        });
      }
    }
    await batch.commit();
  }

  async getEpisodeGenresByEpisodeId(episodeId: string): Promise<Genre[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('episodeId', '==', episodeId)
    );
    const snapshot = await this.ops.getDocs(q);
    const genres: Genre[] = [];

    for (const junction of snapshot.docs) {
      const genreId = junction.data()['genreId'];
      const genreSnap = await this.ops.getDoc(this.ops.doc(this.firestore, 'genres', genreId));
      if (genreSnap.exists()) {
        genres.push({ id: genreSnap.id, ...genreSnap.data() } as Genre);
      }
    }

    return genres;
  }

  async getEpisodesByGenreId(genreId: string): Promise<Episode[]> {
    const junctionQuery = this.ops.query(
      this.ops.collection(this.firestore, 'episodeGenres'),
      this.ops.where('genreId', '==', genreId)
    );
    const junctionSnapshot = await this.ops.getDocs(junctionQuery);
    const episodes: Episode[] = [];

    for (const junction of junctionSnapshot.docs) {
      const episodeId = junction.data()['episodeId'];
      const episodeSnap = await this.ops.getDoc(
        this.ops.doc(this.firestore, 'episodes', episodeId)
      );
      if (episodeSnap.exists() && episodeSnap.data()['isVisible']) {
        episodes.push({ id: episodeSnap.id, ...episodeSnap.data() } as Episode);
      }
    }

    return episodes;
  }

  async getEpisodesByGenreSlug(slug: string): Promise<Episode[]> {
    const genreQuery = this.ops.query(
      this.ops.collection(this.firestore, 'genres'),
      this.ops.where('slug', '==', slug)
    );
    const genreSnapshot = await this.ops.getDocs(genreQuery);
    if (genreSnapshot.empty) {
      return [];
    }

    return this.getEpisodesByGenreId(genreSnapshot.docs[0].id);
  }
}
