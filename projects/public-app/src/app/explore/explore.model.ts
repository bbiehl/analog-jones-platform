export interface SearchAutoCompleteOption {
  type: 'tag' | 'genre' | 'category';
  value: string;
  id?: string;
}
