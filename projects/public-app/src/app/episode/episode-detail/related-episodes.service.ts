import { inject, Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FIRESTORE } from '../../../../../../libs/shared/firebase.token';
import { Episode, EpisodeWithRelations } from '../../../../../../libs/episode/episode.model';

@Injectable({ providedIn: 'root' })
export class RelatedEpisodesService {
  private firestore = inject(FIRESTORE);

  async getRelatedEpisodes(episode: EpisodeWithRelations, max = 12): Promise<Episode[]> {
    const byDateDesc = (a: Episode, b: Episode) =>
      b.episodeDate.toMillis() - a.episodeDate.toMillis();

    const tagResults = new Map<string, Episode>();
    await this.collectFromJunction(
      episode,
      tagResults,
      'episodeTags',
      'tagId',
      episode.tags.map((t) => t.id).filter((id): id is string => !!id)
    );

    const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
    if (tagsSorted.length >= max) {
      return tagsSorted.slice(0, max);
    }

    const genreResults = new Map<string, Episode>();
    await this.collectFromJunction(
      episode,
      genreResults,
      'episodeGenres',
      'genreId',
      episode.genres.map((g) => g.id).filter((id): id is string => !!id)
    );
    for (const id of tagResults.keys()) {
      genreResults.delete(id);
    }

    const genresSorted = Array.from(genreResults.values()).sort(byDateDesc);
    return [...tagsSorted, ...genresSorted].slice(0, max);
  }

  private async collectFromJunction(
    episode: EpisodeWithRelations,
    results: Map<string, Episode>,
    junctionCollection: string,
    junctionField: string,
    ids: string[]
  ): Promise<void> {
    for (const id of ids) {
      const junctionSnap = await getDocs(
        query(collection(this.firestore, junctionCollection), where(junctionField, '==', id))
      );

      for (const junction of junctionSnap.docs) {
        const episodeId = junction.data()['episodeId'] as string;
        if (episodeId === episode.id || results.has(episodeId)) continue;

        const epSnap = await getDoc(doc(this.firestore, 'episodes', episodeId));
        if (epSnap.exists() && epSnap.data()['isVisible']) {
          results.set(episodeId, { id: epSnap.id, ...epSnap.data() } as Episode);
        }
      }
    }
  }
}
