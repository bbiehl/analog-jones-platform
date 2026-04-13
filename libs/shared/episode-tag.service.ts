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
import { Episode } from '../episode/episode.model';
import { Tag } from '../tag/tag.model';
import { FIRESTORE } from './firebase.token';

@Injectable({ providedIn: 'root' })
export class EpisodeTagService {
  private firestore = inject(FIRESTORE);

  async createEpisodeTag(episodeId: string, tagId: string): Promise<void> {
    await addDoc(collection(this.firestore, 'episodeTags'), { episodeId, tagId });
  }

  async deleteEpisodeTag(episodeId: string, tagId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeTags'),
      where('episodeId', '==', episodeId),
      where('tagId', '==', tagId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeTagsByTagId(tagId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeTags'),
      where('tagId', '==', tagId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeTagsByEpisodeId(episodeId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'episodeTags'),
      where('episodeId', '==', episodeId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async getEpisodeTagsByEpisodeId(episodeId: string): Promise<Tag[]> {
    const q = query(
      collection(this.firestore, 'episodeTags'),
      where('episodeId', '==', episodeId)
    );
    const snapshot = await getDocs(q);
    const tags: Tag[] = [];

    for (const junction of snapshot.docs) {
      const tagId = junction.data()['tagId'];
      const tagSnap = await getDoc(doc(this.firestore, 'tags', tagId));
      if (tagSnap.exists()) {
        tags.push({ id: tagSnap.id, ...tagSnap.data() } as Tag);
      }
    }

    return tags;
  }

  async getEpisodesByTagSlug(slug: string): Promise<Episode[]> {
    const tagQuery = query(
      collection(this.firestore, 'tags'),
      where('slug', '==', slug)
    );
    const tagSnapshot = await getDocs(tagQuery);
    if (tagSnapshot.empty) {
      return [];
    }

    const tagId = tagSnapshot.docs[0].id;
    const junctionQuery = query(
      collection(this.firestore, 'episodeTags'),
      where('tagId', '==', tagId)
    );
    const junctionSnapshot = await getDocs(junctionQuery);
    const episodes: Episode[] = [];

    for (const junction of junctionSnapshot.docs) {
      const episodeId = junction.data()['episodeId'];
      const episodeSnap = await getDoc(doc(this.firestore, 'episodes', episodeId));
      if (episodeSnap.exists()) {
        episodes.push({ id: episodeSnap.id, ...episodeSnap.data() } as Episode);
      }
    }

    return episodes;
  }
}
