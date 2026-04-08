export interface Episode {
  id: string;
  about: string;
  description: string;
  episodeDate: Date;
  episodeDuration: number; // Duration in minutes
  isVisible: boolean;
  keyTakeaways: string[];
  links: {
    spotify?: string;
    youtube?: string;
  }
  quotes: string[];
  museum: MuseumItem[];
  thumbnailUrl: string | null;
  title: string;
  year: number;
}

export interface MuseumItem {
  name: string;
  explanation: string;
}
