import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../utils/customBaseQuery";

export const workflowApi = createApi({
  reducerPath: "workflowApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["workflow"],
  endpoints: (builder) => ({
    getPendingRequests: builder.query({
      query: () => "/workflow/pending-requests",
      providesTags: ["workflow"],
    }),
    initiateWorkflow: builder.mutation<any, number>({
      query: (wf_div_id) => ({
        url: `/workflow/initiate?wf_div_id=${wf_div_id}`,
        method: "POST",
      }),
    }),
    getPoDetails: builder.query<any, { po_no: string; org_id?: number }>({
      query: ({ po_no, org_id = 285 }) => `/workflow/po-details/${po_no}?org_id=${org_id}`,
    }),
    processAction: builder.mutation({
      query: (payload) => ({
        url: "/workflow/post-transaction",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["workflow"],
    }),
    getTransactions: builder.mutation({
      query: (payload) => ({
        url: "/workflow/get-transactions",
        method: "POST",
        body: payload,
      }),
    }),
    getUsers: builder.query<any, void>({
      query: () => "/users",
    }),
    getGlDivision: builder.query<any, any>({
      query: (payload) => ({
        url: "/workflow/gl-repository/division",
        method: "POST",
        body: payload,
      }),
    }),
    getGlSegment3: builder.query<any, any>({
      query: (payload) => ({
        url: "/workflow/gl-repository/segment3",
        method: "POST",
        body: payload,
      }),
    }),
    getGlSegment4: builder.query<any, any>({
      query: (payload) => ({
        url: "/workflow/gl-repository/segment4",
        method: "POST",
        body: payload,
      }),
    }),
    getGlSegment5: builder.query<any, any>({
      query: (payload) => ({
        url: "/workflow/gl-repository/segment5",
        method: "POST",
        body: payload,
      }),
    }),
    getInvoiceBreakthrough: builder.query<any, any>({
      query: (payload) => ({
        url: "/workflow/invoice/breakthrough",
        method: "POST",
        body: payload,
      }),
    }),
    getVendors: builder.query<any, any>({
      query: (payload) => ({
        url: "/workflow/suppliers/getvendors",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetPendingRequestsQuery,
  useInitiateWorkflowMutation,
  useGetPoDetailsQuery,
  useLazyGetPoDetailsQuery,
  useProcessActionMutation,
  useGetTransactionsMutation,
  useGetUsersQuery,
  useGetGlDivisionQuery,
  useLazyGetGlDivisionQuery,
  useGetGlSegment3Query,
  useLazyGetGlSegment3Query,
  useGetGlSegment4Query,
  useLazyGetGlSegment4Query,
  useGetGlSegment5Query,
  useLazyGetGlSegment5Query,
  useGetInvoiceBreakthroughQuery,
  useLazyGetInvoiceBreakthroughQuery,
  useGetVendorsQuery,
  useLazyGetVendorsQuery,
} = workflowApi;
