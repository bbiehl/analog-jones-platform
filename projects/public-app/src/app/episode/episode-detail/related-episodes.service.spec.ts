/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { EpisodeService } from '@aj/core';
import type { Episode } from '@aj/core';
import { RelatedEpisodesService } from './related-episodes.service';

describe('RelatedEpisodesService', () => {
  let service: RelatedEpisodesService;
  let mockEpisodeService: { getVisibleEpisodeList: ReturnType<typeof vi.fn> };

  // Minimal Episode shape — only the fields the service reads.
  const ep = (id: string, ms: number, tagIds: (string | undefined)[]): Episode =>
    ({
      id,
      episodeDate: { toMillis: () => ms },
      tags: tagIds.map((tid) => ({ id: tid, name: tid ?? '', slug: tid ?? '' })),
      genres: [],
      categories: [],
    }) as unknown as Episode;

  const source = (tagIds: (string | undefined)[]): Episode => ep('ep-source', 0, tagIds);

  beforeEach(() => {
    mockEpisodeService = { getVisibleEpisodeList: vi.fn().mockResolvedValue([]) };

    TestBed.configureTestingModule({
      providers: [
        RelatedEpisodesService,
        { provide: EpisodeService, useValue: mockEpisodeService },
      ],
    });
    service = TestBed.inject(RelatedEpisodesService);
  });

  it('should be created', () => {
    expect(service).toBeInstanceOf(RelatedEpisodesService);
  });

  it('should return an empty list when max is 0', async () => {
    const result = await service.getRelatedEpisodes(source(['t1']), 0);

    expect(result).toEqual([]);
    expect(mockEpisodeService.getVisibleEpisodeList).not.toHaveBeenCalled();
  });

  it('should return an empty list when the episode has no tags', async () => {
    const result = await service.getRelatedEpisodes(source([]));

    expect(result).toEqual([]);
    expect(mockEpisodeService.getVisibleEpisodeList).not.toHaveBeenCalled();
  });

  it('should drop tag entries with falsy ids and skip the read when none remain', async () => {
    const result = await service.getRelatedEpisodes(source([undefined, '']));

    expect(result).toEqual([]);
    expect(mockEpisodeService.getVisibleEpisodeList).not.toHaveBeenCalled();
  });

  it('should return episodes sharing a tag, excluding the source, sorted by date desc', async () => {
    mockEpisodeService.getVisibleEpisodeList.mockResolvedValueOnce([
      ep('ep-source', 999, ['t1']), // self — excluded
      ep('ep-old', 100, ['t1']),
      ep('ep-new', 300, ['t1', 't9']),
      ep('ep-unrelated', 400, ['t8']), // no shared tag — excluded
    ]);

    const result = await service.getRelatedEpisodes(source(['t1']));

    expect(result.map((e) => e.id)).toEqual(['ep-new', 'ep-old']);
  });

  it('should match when any tag overlaps', async () => {
    mockEpisodeService.getVisibleEpisodeList.mockResolvedValueOnce([
      ep('ep-a', 200, ['t2']),
      ep('ep-b', 100, ['t3']),
    ]);

    const result = await service.getRelatedEpisodes(source(['t1', 't2']));

    expect(result.map((e) => e.id)).toEqual(['ep-a']);
  });

  it('should slice results to max', async () => {
    mockEpisodeService.getVisibleEpisodeList.mockResolvedValueOnce([
      ep('ep-a', 400, ['t1']),
      ep('ep-b', 300, ['t1']),
      ep('ep-c', 200, ['t1']),
    ]);

    const result = await service.getRelatedEpisodes(source(['t1']), 2);

    expect(result.map((e) => e.id)).toEqual(['ep-a', 'ep-b']);
  });

  it('should propagate errors from the episode list read', async () => {
    mockEpisodeService.getVisibleEpisodeList.mockRejectedValueOnce(new Error('boom'));

    await expect(service.getRelatedEpisodes(source(['t1']))).rejects.toThrow('boom');
  });
});
