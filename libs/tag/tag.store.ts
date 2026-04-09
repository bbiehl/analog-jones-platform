import { Tag, TagWithRelations } from './tag.model';

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
