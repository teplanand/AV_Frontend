// src/utils/tokenUtils.ts
export const setToken = (token: string): void => {
  // Set in localStorage
  localStorage.setItem("authToken", token);

  // Set in cookie that expires in 7 days
  const date = new Date();
  date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `authToken=${token};${expires};path=/;SameSite=Strict`;
};

export const getToken = (): string | null => {
  // First check localStorage
  const localStorageToken = localStorage.getItem("authToken");
  if (localStorageToken) return localStorageToken;

  // If not in localStorage, check cookies
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];

  return cookieToken || null;
};

export const removeToken = (): void => {
  // Remove from localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("selectedBranches");

  // Remove cookie by setting past expiration
  document.cookie =
    "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const decodeToken = <T = any>(token: string): T | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const getDecodedToken = <T = any>(): T | null => {
  const token = getToken();
  if (!token) return null;

  return decodeToken<T>(token);
};
