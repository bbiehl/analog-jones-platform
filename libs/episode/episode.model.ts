export interface Episode {
  id: string;
  about: string;
  keyTakeaways: string[];
  theMuseum: string[];
  quotes: string[];
  title: string;
  description: string;
  genre: string;
//   category: EpisodeCategory;
//   tags: EpisodeTag[];
  releaseDate: Date;
  duration: number; // Duration in minutes
  isVisible: boolean;
}
