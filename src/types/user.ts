export const USER_ROLES = ["administrador", "cajero"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  role: UserRole;
};

export type PublicUser = SessionUser & {
  active: boolean;
  createdAt: string;
};
