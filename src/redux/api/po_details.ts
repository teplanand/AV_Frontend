import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../utils/rtkHelper";

export const poDetailsApi = createApi({
    reducerPath: "poDetailsApi",
    baseQuery: customBaseQuery,
    tagTypes: ["PODetails"],

    endpoints: (builder) => ({
        // ✅ CREATE PO Detail
        createPODetails: builder.mutation({
            query: (data) => ({
                url: `/po-details`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["PODetails"],
        }),

        // ✅ LIST PO Details (Pagination + Filters)
        listPODetails: builder.query({
            query: ({
                skip = 0,
                limit = 10,
                search = "",
                is_active,
                sort_by,
                sort_order,
            }) => {
                const params: any = { skip, limit };

                if (search) params.search = search;
                if (is_active !== undefined && is_active !== null)
                    params.is_active = is_active;
                if (sort_by) params.sort_by = sort_by;
                if (sort_order) params.sort_order = sort_order;

                return {
                    url: `/po-details`,
                    method: "GET",
                    params,
                };
            },
            providesTags: ["PODetails"],
        }),

        // ✅ GET ALL PO Details
        getAllPODetails: builder.query({
            query: ({
                search = "",
                is_active,
            }: { search?: string, is_active?: boolean }) => {
                const params: any = { search };

                if (is_active !== undefined && is_active !== null)
                    params.is_active = is_active;

                return {
                    url: `/po-details/all`,
                    method: "GET",
                    params,
                };
            },
            providesTags: ["PODetails"],
        }),

        // ✅ GET PO Detail by ID
        getPODetailById: builder.query({
            query: (id) => `/po-details/${id}`,
            providesTags: ["PODetails"],
        }),

        // ✅ UPDATE PO Detail
        updatePODetail: builder.mutation({
            query: ({ id, data }) => ({
                url: `/po-details/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["PODetails"],
        }),

        // ✅ SOFT DELETE PO Detail
        softDeletePODetail: builder.mutation({
            query: (id) => ({
                url: `/po-details/soft/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PODetails"],
        }),
    }),
});

export const {
    useCreatePODetailsMutation,
    useListPODetailsQuery,
    useGetAllPODetailsQuery,
    useGetPODetailByIdQuery,
    useUpdatePODetailMutation,
    useSoftDeletePODetailMutation,
} = poDetailsApi;
