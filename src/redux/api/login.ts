import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../utils/customBaseQuery";

interface ResetPasswordBody {
  email: string;
  password: string;
}

export const loginApi = createApi({
  reducerPath: "loginApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["login"],
  endpoints: (builder) => ({
    sendOtp: builder.mutation({
      query: (body) => ({
        url: "/auth/send-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["login"],
    }),
    verifyOtp: builder.mutation({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    resetPassword: builder.mutation({
      query: (credentials: ResetPasswordBody) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: credentials,
      }),
    }),

    getMyPermissions: builder.query({
      query: () => "/auth/me/permissions",
    }),

    logoutAll: builder.mutation({
      query: () => ({
        url: "/auth/logout-all",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useLoginMutation,
  useResetPasswordMutation,
  useGetMyPermissionsQuery,
  useLogoutAllMutation,
} = loginApi;

