import { Category } from "./category.model";

interface CategoryState {
    categories: Category[];
    loading: boolean;
    error: string | null;
}

const initalState: CategoryState = {
    categories: [],
    loading: false,
    error: null
};