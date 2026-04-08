import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  avatarUrl: string | null;
  createdAt: Timestamp;
  email: string;
  isAdmin: boolean;
  name: string;
}
