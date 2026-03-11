const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USER_KEY = "user";

const isBrowser = () => typeof window !== "undefined";

export const getAccessToken = () => (isBrowser() ? localStorage.getItem(ACCESS_KEY) : null);

export const getRefreshToken = () => (isBrowser() ? localStorage.getItem(REFRESH_KEY) : null);

export const setTokens = (access?: string, refresh?: string) => {
  if (!isBrowser()) return;
  if (access) {
    localStorage.setItem(ACCESS_KEY, access);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
};

export const clearTokens = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const getStoredUser = <T = unknown>(): T | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: unknown | null) => {
  if (!isBrowser()) return;
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
