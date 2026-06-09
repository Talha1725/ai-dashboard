export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
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
