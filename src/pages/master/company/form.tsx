/* eslint-disable react-hooks/exhaustive-deps */
import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useFormik } from "formik";
import React, { useEffect, useMemo } from "react";
import * as yup from "yup";
import "../../../index.css";

import DialogWrapper from "../../../components/DialogWrapper";
import LoadingButton from "../../../components/LoadingButton";
import MobileInput from "../../../components/MobileInput";
import { useToast } from "../../../hooks/useToast";
import {
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from "../../../redux/api/company";

import { CompanyType } from "../../../types/Modules/company.type";
import { formikFieldProps } from "../../../utils/formikHelpers";

interface CompanyFormProps {
  open: boolean;
  company: CompanyType | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface CompanyFormValues {
  id?: number;

  name: string;
  legal_name: string;
  short_name: string;

  address: string;
  city_id: number | null;
  state_id: number | null;
  country_id: number | null;
  pincode: string;

  mobile: string;
  ccode_mobile: string;
  alternative_mobile: string;
  ccode_other: string;
  gst_number: string;
  email: string;
  document_id: number | null;
  status: boolean;
}

const validationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(255, "Company name must be 255 characters or less"),

  short_name: yup
    .string()
    .trim()
    .max(100, "Short name must be 100 characters or less"),

  legal_name: yup
    .string()
    .trim()
    .required("Legal name is required")
    .max(255, "Legal name must be 255 characters or less"),

  address: yup
    .string()
    .trim()
    .max(500, "Address must be 500 characters or less"),

  city_id: yup.number().required("City is required"),
  state_id: yup.number().required("State is required"),
  country_id: yup.number().required("Country is required"),

  pincode: yup.string().trim().max(20, "Pincode must be 20 characters or less"),

  mobile: yup
    .string()
    .required("Mobile Number is Required")
    .max(20, "Mobile must be 20 characters or less"),
  ccode_mobile: yup
    .string()
    // .required("Mobile country code is required")
    .max(5, "Country code must be 5 characters or less"),

  alternative_mobile: yup
    .string()
    .matches(/^[0-9]*$/, "Alternative mobile must contain only digits")
    .max(32, "Alternative mobile must be 32 characters or less"),

  ccode_other: yup
    .string()
    .max(5, "Alternative Mobile Country code must be 5 characters or less"),

  gst_number: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
      message: "Invalid GST number format",
      excludeEmptyString: true,
    }),

  email: yup
    .string()
    .trim()
    .required("Email is required")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
      "Invalid email format",
    )
    .max(255, "Email must be 255 characters or less"),

  document_id: yup.number().nullable(),

  status: yup.boolean().default(true),
});

const CompanyForm: React.FC<CompanyFormProps> = ({
  open,
  company,
  onClose,
  onSuccess,
}) => {
  const [createCompany, { isLoading: isCreating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();

  const { showToast } = useToast();
  const isLoading = isCreating || isUpdating;
  const isEdit = Boolean(company);

  const formik = useFormik<CompanyFormValues>({
    initialValues: {
      name: company?.name || "",
      short_name: company?.short_name || "",
      legal_name: company?.legal_name || "",
      address: company?.address || "",
      city_id: company?.city_id || null,
      state_id: company?.state_id || null,
      country_id: company?.country_id || null,
      pincode: company?.pincode || "",
      gst_number: company?.gst_number || "",
      email: company?.email || "",
      document_id: company?.document_id || null,
      status: company?.status !== undefined ? Boolean(company.status) : true,
      mobile: company?.mobile || "",
      ccode_mobile: company?.ccode_mobile || "",
      alternative_mobile: company?.alternative_mobile || "",
      ccode_other: company?.ccode_other || "",
    },
    validationSchema,

    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          city_id: values.city_id,
          document_id: values.document_id,
          status: values.status ? 1 : 0,

          mobile: values?.mobile || "",
          ccode_mobile: values?.ccode_mobile || "",
          alternative_mobile: values?.alternative_mobile || "",
          ccode_other: values?.ccode_other || "",
        };

        if (isEdit && company) {
          await updateCompany({
            id: company.id,
            data: payload,
          }).unwrap();
          showToast("Company updated successfully", "success");
        } else {
          await createCompany(payload).unwrap();
          showToast("Company created successfully", "success");
        }

        onClose();
        formik.resetForm();
        if (onSuccess) onSuccess();
      } catch (error: any) {
        console.error("Failed to save company:", error.data.detail);
        showToast(
          error?.data?.detail ||
          `Failed to ${isEdit ? "update" : "create"} company`,
          "error",
        );
      }
    },
    enableReinitialize: true,
  });

  // Filter states based on selected country
  const handleCountryChange = (e: any) => {
    const countryId = e.target.value ? parseInt(e.target.value) : "";
    formik.setFieldValue("country_id", countryId);
    formik.setFieldValue("state_id", "");
    formik.setFieldValue("city_id", "");
  };

  const handleStateChange = (e: any) => {
    const stateId = e.target.value ? parseInt(e.target.value) : "";
    formik.setFieldValue("state_id", stateId);
    formik.setFieldValue("city_id", "");
  };

  const handleCityChange = (e: any) => {
    const cityId = e.target.value ? parseInt(e.target.value) : "";
    formik.setFieldValue("city_id", cityId);
  };
  // Handle document upload
  const handleDocumentChange = (documentIds: number[] | number | null) => {
    if (
      !documentIds ||
      (Array.isArray(documentIds) && documentIds.length === 0)
    ) {
      formik.setFieldValue("document_id", null);
      return;
    }

    const id = Array.isArray(documentIds) ? documentIds[0] : documentIds;
    if (id) formik.setFieldValue("document_id", id);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  return (
    <DialogWrapper
      open={open}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      maxWidth="lg"
      title={isEdit ? "Edit Company" : "Add New Company"}
    >
      <form
        key={isEdit ? company?.id : "new"}
        noValidate
        onSubmit={formik.handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <DialogContent
          dividers
          sx={{
            p: 2,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Basic Information */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Box>
                <TextField
                  id="name"
                  fullWidth
                  label="Company Name"
                  {...formikFieldProps(formik, "name")}
                  disabled={isLoading}
                  placeholder="Enter company name"
                  size="small"
                  required
                />
              </Box>
              <Box>
                <TextField
                  id="short_name"
                  fullWidth
                  label="Short Name"
                  {...formikFieldProps(formik, "short_name")}
                  disabled={isLoading}
                  placeholder="Company short name (optional)"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  id="legal_name"
                  fullWidth
                  label="Legal Name"
                  {...formikFieldProps(formik, "legal_name")}
                  disabled={isLoading}
                  placeholder="Enter legal company name as per registration"
                  size="small"
                  required
                />
              </Box>
              <Box>
                <TextField
                  id="email"
                  fullWidth
                  label="Email"
                  type="email"
                  {...formikFieldProps(formik, "email")}
                  disabled={isLoading}
                  placeholder="company@example.com"
                  size="small"
                  required
                />
              </Box>
              <Box>
                <MobileInput
                  id="mobile"
                  name="mobile"
                  value={`+${formik.values.ccode_mobile?.replace("+", "") || "91"
                    }${formik.values.mobile || ""}`}
                  onChange={(mobileData) => {
                    formik.setFieldValue("mobile", mobileData?.rawNumber || "");
                    formik.setFieldValue(
                      "ccode_mobile",
                      `+${mobileData?.dialCode || "91"}`,
                    );
                  }}
                  onBlur={formik.handleBlur}
                  error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                  helperText={formik.touched.mobile && formik.errors.mobile}
                  disabled={isLoading}
                  placeholder="Mobile number *"
                  required
                  size="small"
                  fullWidth
                />
              </Box>

              <Box>
                <MobileInput
                  id="alternative_mobile"
                  name="alternative_mobile"
                  value={`+${formik.values.ccode_other?.replace("+", "") || "91"
                    }${formik.values.alternative_mobile || ""}`}
                  onChange={(mobileData) => {
                    formik.setFieldValue(
                      "alternative_mobile",
                      mobileData?.rawNumber || "",
                    );
                    formik.setFieldValue(
                      "ccode_other",
                      `+${mobileData?.dialCode || "91"}`,
                    );
                  }}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.alternative_mobile &&
                    Boolean(formik.errors.alternative_mobile)
                  }
                  helperText={
                    formik.touched.alternative_mobile &&
                    formik.errors.alternative_mobile
                  }
                  disabled={isLoading}
                  placeholder="alternative number"
                  size="small"
                  fullWidth
                />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
              <Box>
                <TextField
                  id="gst_number"
                  fullWidth
                  label="GST Number"
                  {...formikFieldProps(formik, "gst_number")}
                  disabled={isLoading}
                  placeholder="Enter GST number"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Pincode"
                  id="pincode"
                  {...formikFieldProps(formik, "pincode")}
                  disabled={isLoading}
                  placeholder="Pincode"
                  size="small"
                />
              </Box>
            </Box>

            {/* Location Dropdowns - Dependent */}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
              <Box>
                <TextField
                  id="address"
                  fullWidth
                  label="Address"
                  {...formikFieldProps(formik, "address")}
                  disabled={isLoading}
                  placeholder="Enter complete company address"
                  size="small"
                  multiline
                  rows={2}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button
            onClick={() => {
              formik.resetForm();
              onClose();
            }}
            disabled={isLoading}
            variant="outlined"
            color="error"
            sx={{
              borderRadius: "4px",
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isLoading}
            loadingText={isEdit ? "Updating..." : "Creating..."}
            sx={{ borderRadius: "4px", width: { xs: "100%", sm: "auto" } }}
          >
            {isEdit ? "Update" : "Create"}
          </LoadingButton>
        </DialogActions>
      </form>
    </DialogWrapper>
  );
};

export default CompanyForm;
