import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Category, CategoryWithRelations } from './category.model';
import { CategoryService } from './category.service';

interface CategoryState {
  categories: Category[];
  selectedCategory: CategoryWithRelations | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,
};

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const categoryService = inject(CategoryService);

    return {
      async loadCategories() {
        patchState(store, { loading: true, error: null });
        try {
          const categories = await categoryService.getAllCategories();
          patchState(store, { categories, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadCategoryById(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          const category = await categoryService.getCategoryById(id);
          patchState(store, {
            selectedCategory: { ...category, episodes: [] },
            loading: false,
          });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async createCategory(category: Omit<Category, 'id'>) {
        patchState(store, { loading: true, error: null });
        try {
          await categoryService.createCategory(category);
          const categories = await categoryService.getAllCategories();
          patchState(store, { categories, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async updateCategory(id: string, category: Partial<Category>) {
        patchState(store, { loading: true, error: null });
        try {
          await categoryService.updateCategory(id, category);
          const categories = await categoryService.getAllCategories();
          patchState(store, { categories, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async deleteCategory(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          await categoryService.deleteCategory(id);
          const categories = await categoryService.getAllCategories();
          patchState(store, { categories, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      clearSelectedCategory() {
        patchState(store, { selectedCategory: null });
      },
    };
  })
);
