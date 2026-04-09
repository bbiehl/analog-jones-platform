import { Genre, GenreWithRelations } from './genre.model';

interface GenreState {
  genres: Genre[];
  selectedGenre: GenreWithRelations | null;
  loading: boolean;
  error: string | null;
}

const initialState: GenreState = {
  genres: [],
  selectedGenre: null,
  loading: false,
  error: null,
};
