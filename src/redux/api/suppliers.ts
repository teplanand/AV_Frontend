import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../utils/rtkHelper";

export const suppliersApi = createApi({
    reducerPath: "suppliersApi",
    baseQuery: customBaseQuery,
    tagTypes: ["Suppliers"],

    endpoints: (builder) => ({
        // ✅ CREATE Supplier
        createSupplier: builder.mutation({
            query: (data) => ({
                url: `/suppliers`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Suppliers"],
        }),

        // ✅ LIST Suppliers (Pagination + Filters)
        listSuppliers: builder.query({
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
                    url: `/suppliers`,
                    method: "GET",
                    params,
                };
            },
            providesTags: ["Suppliers"],
        }),

        // ✅ GET ALL Suppliers
        getAllSuppliers: builder.query({
            query: ({
                search = "",
                is_active,
            }: { search?: string, is_active?: boolean }) => {
                const params: any = { search };

                if (is_active !== undefined && is_active !== null)
                    params.is_active = is_active;

                return {
                    url: `/suppliers/all`,
                    method: "GET",
                    params,
                };
            },
            providesTags: ["Suppliers"],
        }),

        // ✅ GET Supplier by ID
        getSupplierById: builder.query({
            query: (id) => `/suppliers/${id}`,
            providesTags: ["Suppliers"],
        }),

        // ✅ UPDATE Supplier
        updateSupplier: builder.mutation({
            query: ({ id, data }) => ({
                url: `/suppliers/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Suppliers"],
        }),

        // ✅ SOFT DELETE Supplier
        softDeleteSupplier: builder.mutation({
            query: (id) => ({
                url: `/suppliers/soft/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Suppliers"],
        }),
    }),
});

export const {
    useCreateSupplierMutation,
    useListSuppliersQuery,
    useGetAllSuppliersQuery,
    useGetSupplierByIdQuery,
    useUpdateSupplierMutation,
    useSoftDeleteSupplierMutation,
} = suppliersApi;
