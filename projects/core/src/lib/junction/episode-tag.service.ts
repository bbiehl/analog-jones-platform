import { inject, Injectable } from '@angular/core';
import { Episode } from '../episode/episode.model';
import { Tag } from '../tag/tag.model';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';

@Injectable({ providedIn: 'root' })
export class EpisodeTagService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async createEpisodeTag(episodeId: string, tagId: string): Promise<void> {
    await this.ops.addDoc(this.ops.collection(this.firestore, 'episodeTags'), {
      episodeId,
      tagId,
    });
  }

  async deleteEpisodeTag(episodeId: string, tagId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('episodeId', '==', episodeId),
      this.ops.where('tagId', '==', tagId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeTagsByTagId(tagId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('tagId', '==', tagId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async deleteEpisodeTagsByEpisodeId(episodeId: string): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('episodeId', '==', episodeId)
    );
    const snapshot = await this.ops.getDocs(q);
    const batch = this.ops.writeBatch(this.firestore);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async getEpisodeIdsByTagId(tagId: string): Promise<string[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('tagId', '==', tagId)
    );
    const snapshot = await this.ops.getDocs(q);
    return Array.from(new Set(snapshot.docs.map((d) => d.data()['episodeId'] as string)));
  }

  async setEpisodesForTag(tagId: string, episodeIds: string[]): Promise<void> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('tagId', '==', tagId)
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
        batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeTags')), {
          episodeId,
          tagId,
        });
      }
    }
    await batch.commit();
  }

  async getEpisodeTagsByEpisodeId(episodeId: string): Promise<Tag[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('episodeId', '==', episodeId)
    );
    const snapshot = await this.ops.getDocs(q);
    const tags: Tag[] = [];

    for (const junction of snapshot.docs) {
      const tagId = junction.data()['tagId'];
      const tagSnap = await this.ops.getDoc(this.ops.doc(this.firestore, 'tags', tagId));
      if (tagSnap.exists()) {
        tags.push({ id: tagSnap.id, ...tagSnap.data() } as Tag);
      }
    }

    return tags;
  }

  async getEpisodesByTagId(tagId: string): Promise<Episode[]> {
    const junctionQuery = this.ops.query(
      this.ops.collection(this.firestore, 'episodeTags'),
      this.ops.where('tagId', '==', tagId)
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
}
