import { Category, CategoryWithRelations } from './category.model';

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
