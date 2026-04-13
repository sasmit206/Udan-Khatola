export type AuthUser = {
  userId: number;
  role: string;
  email?: string;
  name?: string;
};

export function getToken() {
  return localStorage.getItem('token');
}

export function parseJwt(token: string | null): AuthUser | null {
  if (!token) {
    return null;
  }

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getAuthUser() {
  return parseJwt(getToken());
}

export function storeAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function storeAuthProfile(profile: { email: string; name?: string }) {
  localStorage.setItem('auth_email', profile.email);
  if (profile.name) {
    localStorage.setItem('auth_name', profile.name);
  }
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('auth_email');
  localStorage.removeItem('auth_name');
}
