import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../utils/rtkHelper";

export const documentApi = createApi({
    reducerPath: "documentApi",
    baseQuery: customBaseQuery,
    tagTypes: ["Document"],
    endpoints: (builder) => ({
        getDocumentById: builder.query({
            query: (id) => `/document/${id}`,
            providesTags: ["Document"],
        }),
        uploadDocument: builder.mutation({
            query: (data) => ({
                url: `/document/upload`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Document"],
        }),
    }),
});

export const {
    useGetDocumentByIdQuery,
    useUploadDocumentMutation,
} = documentApi;
