import { User } from '@protocolsync/shared-types';

export interface IAuthService {
  login(): Promise<AuthResponse>;
  logout(): Promise<void>;
  getToken(): Promise<string>;
  isAuthenticated(): boolean | Promise<boolean>;
  getUser(): Promise<User>;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
  expiresAt?: number;
}
