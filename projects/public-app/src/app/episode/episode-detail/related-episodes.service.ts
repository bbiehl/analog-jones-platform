import { inject, Injectable } from '@angular/core';
import { FIRESTORE, FIRESTORE_OPS } from '@aj/core';
import { Episode, EpisodeWithRelations } from '@aj/core';

@Injectable({ providedIn: 'root' })
export class RelatedEpisodesService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);

  async getRelatedEpisodes(episode: EpisodeWithRelations, max = 12): Promise<Episode[]> {
    if (max <= 0) return [];

    const byDateDesc = (a: Episode, b: Episode) =>
      b.episodeDate.toMillis() - a.episodeDate.toMillis();

    const tagIds = episode.tags.map((t) => t.id).filter((id): id is string => !!id);
    if (tagIds.length === 0) return [];

    const tagResults = new Map<string, Episode>();
    await this.collectFromJunction(episode, tagResults, 'episodeTags', 'tagId', tagIds);

    return Array.from(tagResults.values()).sort(byDateDesc).slice(0, max);
  }

  private async collectFromJunction(
    episode: EpisodeWithRelations,
    results: Map<string, Episode>,
    junctionCollection: string,
    junctionField: string,
    ids: string[],
  ): Promise<void> {
    const { collection, doc, getDoc, getDocs, query, where } = this.ops;
    for (const id of ids) {
      const junctionSnap = await getDocs(
        query(collection(this.firestore, junctionCollection), where(junctionField, '==', id)),
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
