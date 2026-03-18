export type UserModel = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  metadata?: unknown;
  raw?: unknown;
};

export type UpdateProfileInput = {
  displayName?: string;
  avatarUrl?: string;
  email?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};