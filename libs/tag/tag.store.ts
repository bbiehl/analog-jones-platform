interface TagState {
  tags: string[];
  loading: boolean;
  error: string | null;
}

const initialState: TagState = {
  tags: [],
  loading: false,
  error: null,
};
