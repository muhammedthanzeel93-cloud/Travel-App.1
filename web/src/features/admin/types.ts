export interface AdminAuthCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AdminUserSession {
  username: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  token: string;
  authenticatedAt: string;
}
