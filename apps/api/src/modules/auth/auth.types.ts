import type { UserDto } from '../users/users.types';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface AuthResult {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}