import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Tag, TagWithRelations } from './tag.model';
import { TagService } from './tag.service';

interface TagState {
  tags: Tag[];
  selectedTag: TagWithRelations | null;
  loading: boolean;
  error: string | null;
}

const initialState: TagState = {
  tags: [],
  selectedTag: null,
  loading: false,
  error: null,
};

export const TagStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const tagService = inject(TagService);

    return {
      async loadTags() {
        patchState(store, { loading: true, error: null });
        try {
          const tags = await tagService.getAllTags();
          patchState(store, { tags, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadTagById(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          const tag = await tagService.getTagById(id);
          patchState(store, {
            selectedTag: { ...tag, episodes: [] },
            loading: false,
          });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadTagBySlug(slug: string) {
        patchState(store, { loading: true, error: null });
        try {
          const tag = await tagService.getTagBySlug(slug);
          patchState(store, { selectedTag: tag, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async createTag(tag: Omit<Tag, 'id'>) {
        patchState(store, { loading: true, error: null });
        try {
          await tagService.createTag(tag);
          const tags = await tagService.getAllTags();
          patchState(store, { tags, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async updateTag(id: string, tag: Partial<Tag>) {
        patchState(store, { loading: true, error: null });
        try {
          await tagService.updateTag(id, tag);
          const tags = await tagService.getAllTags();
          patchState(store, { tags, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async deleteTag(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          await tagService.deleteTag(id);
          const tags = await tagService.getAllTags();
          patchState(store, { tags, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      clearSelectedTag() {
        patchState(store, { selectedTag: null });
      },
    };
  })
);
