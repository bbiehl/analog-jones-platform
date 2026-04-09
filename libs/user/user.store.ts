import { AppUser } from './user.model';

interface UserState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};
