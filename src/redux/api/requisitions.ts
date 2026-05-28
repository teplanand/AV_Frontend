import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../utils/rtkHelper";

export const requisitionsApi = createApi({
    reducerPath: "requisitionsApi",
    baseQuery: customBaseQuery,
    tagTypes: ["Requisitions"],
    endpoints: (builder) => ({
        listRequisitions: builder.query<any, any>({
            query: (params) => ({
                url: "/requisitions",
                method: "GET",
                params,
            }),
            providesTags: ["Requisitions"],
        }),
        getRequisition: builder.query<any, number>({
            query: (id) => `/requisitions/${id}`,
            providesTags: (result, error, id) => [{ type: "Requisitions", id }],
        }),
        createRequisition: builder.mutation<any, any>({
            query: (payload) => ({
                url: "/requisitions",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Requisitions"],
        }),
        updateRequisition: builder.mutation<any, { id: number; data: any }>({
            query: ({ id, data }) => ({
                url: `/requisitions/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Requisitions", id }, "Requisitions"],
        }),
        softDeleteRequisition: builder.mutation<any, number>({
            query: (id) => ({
                url: `/requisitions/soft/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Requisitions"],
        }),
        requisitionAction: builder.mutation<any, { wf_inst_id: number; status: string }>({
            query: (payload) => ({
                url: "/requisitions/action",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Requisitions"],
        }),
        getPendingRequisitions: builder.query<any, void>({
            query: () => "/requisitions/pending/list",
            providesTags: ["Requisitions"],
        }),
        getRequisitionHistory: builder.query({
            query: (id) => `/requisitions/${id}/history`,
            providesTags: ["Requisitions"],
        }),
        getRequisitionStats: builder.query({
            query: () => "/requisitions/stats",
            providesTags: ["Requisitions"],
        }),
        getRequisitionDetails: builder.query<any, number>({
            query: (id) => `/requisitions/${id}/details`,
            providesTags: (result, error, id) => [{ type: "Requisitions", id }],
        }),
        uploadRequisitionAttachments: builder.mutation<any, { id: number; files: File[] }>({
            query: ({ id, files }) => {
                const formData = new FormData();
                files.forEach((file) => {
                    formData.append("files", file);
                });
                return {
                    url: `/requisitions/${id}/attachments`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: (result, error, { id }) => [{ type: "Requisitions", id }],
        }),
        listRequisitionAttachments: builder.query<any, number>({
            query: (id) => `/requisitions/${id}/attachments`,
            providesTags: (result, error, id) => [{ type: "Requisitions", id }],
        }),
        getNextRefCode: builder.query<any, void>({
            query: () => "/requisitions/next-ref",
        }),
    }),
});


export const {
    useListRequisitionsQuery,
    useGetRequisitionQuery,
    useCreateRequisitionMutation,
    useUpdateRequisitionMutation,
    useSoftDeleteRequisitionMutation,
    useRequisitionActionMutation,
    useGetPendingRequisitionsQuery,
    useGetRequisitionHistoryQuery,
    useGetRequisitionStatsQuery,
    useGetRequisitionDetailsQuery,
    useUploadRequisitionAttachmentsMutation,
    useListRequisitionAttachmentsQuery,
    useGetNextRefCodeQuery,
} = requisitionsApi;

