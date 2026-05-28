import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../utils/rtkHelper";

export const budgetaryPaymentsApi = createApi({
    reducerPath: "budgetaryPaymentsApi",
    baseQuery: customBaseQuery,
    tagTypes: ["BudgetaryPayments"],

    endpoints: (builder) => ({
        // ✅ CREATE Budgetary Payment
        createBudgetaryPayment: builder.mutation({
            query: (data) => ({
                url: `/budgetary-payments`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["BudgetaryPayments"],
        }),

        // ✅ LIST Budgetary Payments (Pagination + Filters)
        listBudgetaryPayments: builder.query({
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
                    url: `/budgetary-payments`,
                    method: "GET",
                    params,
                };
            },
            providesTags: ["BudgetaryPayments"],
        }),

        // ✅ GET Budgetary Payment by ID
        getBudgetaryPaymentById: builder.query({
            query: (id) => `/budgetary-payments/${id}`,
            providesTags: ["BudgetaryPayments"],
        }),

        // ✅ UPDATE Budgetary Payment
        updateBudgetaryPayment: builder.mutation({
            query: ({ id, data }) => ({
                url: `/budgetary-payments/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["BudgetaryPayments"],
        }),

        // ✅ SOFT DELETE Budgetary Payment
        softDeleteBudgetaryPayment: builder.mutation({
            query: (id) => ({
                url: `/budgetary-payments/soft/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["BudgetaryPayments"],
        }),

        // ✅ GET Stats
        listBudgetaryStats: builder.query({
            query: () => "/budgetary-payments/stats",
            providesTags: ["BudgetaryPayments"],
        }),

        // ✅ UPLOAD Attachments
        uploadBudgetaryAttachments: builder.mutation({
            query: ({ id, files }) => {
                const formData = new FormData();
                files.forEach((file: File) => {
                    formData.append("files", file);
                });
                return {
                    url: `/budgetary-payments/${id}/attachments`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["BudgetaryPayments"],
        }),

        // ✅ LIST Attachments
        listBudgetaryAttachments: builder.query({
            query: (id) => `/budgetary-payments/${id}/attachments`,
            providesTags: ["BudgetaryPayments"],
        }),
    }),
});

export const {
    useCreateBudgetaryPaymentMutation,
    useListBudgetaryPaymentsQuery,
    useGetBudgetaryPaymentByIdQuery,
    useUpdateBudgetaryPaymentMutation,
    useSoftDeleteBudgetaryPaymentMutation,
    useListBudgetaryStatsQuery,
    useUploadBudgetaryAttachmentsMutation,
    useListBudgetaryAttachmentsQuery,
} = budgetaryPaymentsApi;
