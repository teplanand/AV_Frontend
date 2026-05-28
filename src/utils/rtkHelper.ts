import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken, removeToken } from "./auth";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const customBaseQuery: typeof baseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token expired or invalid
    removeToken(); // Remove from storage
    window.location.href = "/signin"; // ✅ Force redirect to login
  }

  return result;
};
export default customBaseQuery;
