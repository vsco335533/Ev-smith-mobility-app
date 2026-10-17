import { create } from 'zustand';
import { User, RiderProfile } from '../types';
import { setAuthHeader } from '../api/client';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  profile: RiderProfile | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setProfile: (profile: RiderProfile) => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  profile: null,
  isAuthenticated: false,

  login: (token, refreshToken, user) => {
    setAuthHeader(token);
    set({
      token,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    setAuthHeader(null);
    set({
      token: null,
      refreshToken: null,
      user: null,
      profile: null,
      isAuthenticated: false,
    });
  },

  setProfile: (profile) => set({ profile }),

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
}));
