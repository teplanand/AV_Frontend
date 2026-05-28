import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../utils/rtkHelper";

export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Company"],

  endpoints: (builder) => ({
    // ✅ CREATE Company
    createCompany: builder.mutation({
      query: (data) => ({
        url: `/company`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Company"],
    }),

    // ✅ UPLOAD LOGO (FORM DATA)
    uploadLogo: builder.mutation({
      query: ({ company_id, file }) => {
        const formData = new FormData();
        formData.append("company_id", company_id);
        formData.append("file", file);

        return {
          url: `/company/upload-logo`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Company"],
    }),

    // ✅ LIST COMPANIES (Pagination + Filters + Active Status)
    listCompanies: builder.query({
      query: ({
        skip = 0,
        limit = 10,
        search = "",
        // Specific Column Filters
        id,
        name,
        legal_name,
        email,
        mobile,
        gst_number,
        city_id,
        is_active,
        // Sorting
        sort_by,
        sort_order,
      }) => {
        const params: any = { skip, limit };

        if (search) params.search = search;

        // Exact/Partial match filters (Backend implementation dependent, usually partial for strings)
        if (id) params.id = id;
        if (name) params.name = name;
        if (legal_name) params.legal_name = legal_name;
        if (email) params.email = email;
        if (mobile) params.mobile = mobile;
        if (gst_number) params.gst_number = gst_number;

        if (city_id) params.city_id = city_id;
        if (is_active !== undefined && is_active !== null)
          params.is_active = is_active;

        if (sort_by) params.sort_by = sort_by;
        if (sort_order) params.sort_order = sort_order;

        return {
          url: `/company`,
          method: "GET",
          params,
        };
      },
      providesTags: ["Company"],
    }),

    // ✅ GET ALL Companies
    getAllCompanies: builder.query({
      query: ({
        search = "",
        is_active,
      }: {search?: string, is_active?: boolean}) => {
        const params: any = { search };

        if (is_active !== undefined && is_active !== null)
          params.is_active = is_active;

        return {
          url: `/company/all`,
          method: "GET",
          params,
        };
      },
      providesTags: ["Company"],
    }),

    // ✅ GET Company by ID
    getCompanyById: builder.query({
      query: (id) => `/company/${id}`,
      providesTags: ["Company"],
    }),

    // ✅ GET Company by GST Number
    getCompanyByGST: builder.query({
      query: (gst) => `/company/gst/${gst}`,
      providesTags: ["Company"],
    }),

    // ✅ UPDATE Company
    updateCompany: builder.mutation({
      query: ({ id, data }) => ({
        url: `/company/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Company"],
    }),

    // ✅ DELETE Company (hard delete)
    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/company/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Company"],
    }),

    // ✅ SOFT DELETE Company
    softDeleteCompany: builder.mutation({
      query: (id) => ({
        url: `/company/soft/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Company"],
    }),
  }),
});

export const {
  useCreateCompanyMutation,
  useUploadLogoMutation,
  useListCompaniesQuery,
  useGetAllCompaniesQuery,
  useGetCompanyByIdQuery,
  useGetCompanyByGSTQuery,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useSoftDeleteCompanyMutation,
  useLazyGetAllCompaniesQuery
} = companyApi;
