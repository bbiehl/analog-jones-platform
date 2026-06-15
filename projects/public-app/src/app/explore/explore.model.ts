export interface SearchAutoCompleteOption {
  type: 'episode' | 'tag' | 'genre' | 'category';
  value: string;
  id?: string;
}
