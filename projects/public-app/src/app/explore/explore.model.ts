export interface SearchAutoCompleteOption {
  type: 'episode' | 'tag' | 'genre';
  value: string;
  id?: string;
}
