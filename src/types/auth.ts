export type AuthUser = {
  id: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export type AuthResult =
  | {
      authenticated: true;
      user: AuthUser;
      sessionId: string;
    }
  | {
      authenticated: false;
    };
