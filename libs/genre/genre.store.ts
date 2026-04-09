import { Genre } from "./genre.model";

interface GenreState {
  genres: Genre[];
  loading: boolean;
  error: string | null;
}

const initalState: GenreState = {
  genres: [],
  loading: false,
  error: null,
};
