import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  Button,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Divider,
  useTheme,
  DialogTitle,
  Paper,
  DialogActions,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useToast } from "../../hooks/useToast";
import {
  useCreateBudgetaryPaymentMutation,
  useUploadBudgetaryAttachmentsMutation,
} from "../../redux/api/budgetary_payments";
import {
  useInitiateWorkflowMutation,
  useLazyGetGlDivisionQuery,
  useLazyGetGlSegment3Query,
  useLazyGetGlSegment4Query,
  useLazyGetGlSegment5Query,
  useLazyGetVendorsQuery,
} from "../../redux/api/workflow";
import { LoadingButton } from "@mui/lab";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Tooltip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface BudgetaryPaymentModalProps {
  open: boolean;
  onClose: () => void;
}

const BudgetaryPaymentModal: React.FC<BudgetaryPaymentModalProps> = ({
  open,
  onClose,
}) => {
  const { showToast } = useToast();
  const theme = useTheme();
  const [createBudgetaryPayment, { isLoading: isSubmitting }] =
    useCreateBudgetaryPaymentMutation();
  const [uploadAttachments] = useUploadBudgetaryAttachmentsMutation();
  const [initiateWorkflow] = useInitiateWorkflowMutation();
  const [getGlDivision] = useLazyGetGlDivisionQuery();
  const [getGlSegment3] = useLazyGetGlSegment3Query();
  const [getGlSegment4] = useLazyGetGlSegment4Query();
  const [getGlSegment5] = useLazyGetGlSegment5Query();
  const [getVendors] = useLazyGetVendorsQuery();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nameOfPayee: "",
    oracleCode: "",
    supplierSiteCode: "",
    particularsOfPayment: "",
    cjoNo: "",
    invoiceNumber: "",
    invoiceDate: null as Dayjs | null,
    date: dayjs() as Dayjs | null,
    poWoNo: "",
    amount: "",
    amountInWords: "",
    modeOfPayment: "RTGS",
    advanceAdj: "",
    tdsAmount: "",
    tdsSection: "",
    tdsPercentage: "",
    segment1: "",
    segment2: "",
    segment3: "",
    segment4: "",
  });

  const [segment1Options, setSegment1Options] = useState<
    Array<{ Code: string; Description: string }>
  >([]);
  const [segment2Options, setSegment2Options] = useState<
    Array<{ Code: string; Description: string }>
  >([]);
  const [segment3Options, setSegment3Options] = useState<
    Array<{ Code: string; Description: string }>
  >([]);
  const [segment4Options, setSegment4Options] = useState<
    Array<{ Code: string; Description: string }>
  >([]);

  useEffect(() => {
    if (!open) return;

    const fetchInitialData = async () => {
      // Fetch Vendors concurrently
      setIsVendorsLoading(true);
      const vendorsPayload = {
        AppToken: "abcd",
        UserName: "",
        ClientIP: "::1",
        data: { ORG_ID: 285, VENDOR_NUM: null, VENDOR_NAME: "" },
        Other: { doLog: true, whCon: "1=1" },
      };
      const vendorsPromise = getVendors(vendorsPayload)
        .unwrap()
        .then((res) =>
          setVendorsList(Array.isArray(res) ? res : res?.data || []),
        )
        .catch((err) => console.error("Failed to fetch vendors:", err))
        .finally(() => setIsVendorsLoading(false));

      // Fetch Segments concurrently
      const seg1Promise = getGlDivision({})
        .unwrap()
        .then(setSegment1Options)
        .catch((err) => console.error("Failed segment1:", err));
      const seg2Promise = getGlSegment3({})
        .unwrap()
        .then(setSegment2Options)
        .catch((err) => console.error("Failed segment2:", err));
      const seg3Promise = getGlSegment4({})
        .unwrap()
        .then(setSegment3Options)
        .catch((err) => console.error("Failed segment3:", err));
      const seg4Promise = getGlSegment5({})
        .unwrap()
        .then(setSegment4Options)
        .catch((err) => console.error("Failed segment4:", err));

      await Promise.all([
        vendorsPromise,
        seg1Promise,
        seg2Promise,
        seg3Promise,
        seg4Promise,
      ]);
    };

    fetchInitialData();
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, newValue: Dayjs | null) => {
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const uniqueVendors = React.useMemo(() => {
    const map = new Map();
    vendorsList.forEach((v) => {
      if (!map.has(v.VendorId)) {
        map.set(v.VendorId, v);
      }
    });
    return Array.from(map.values());
  }, [vendorsList]);

  const selectedVendorSites = React.useMemo(() => {
    if (!formData.oracleCode) return [];
    return vendorsList.filter(
      (v) => String(v.VendorId) === String(formData.oracleCode),
    );
  }, [formData.oracleCode, vendorsList]);

  const handleVendorSelect = (vendor: any | null) => {
    if (vendor) {
      const sites = vendorsList.filter(
        (v) => String(v.VendorId) === String(vendor.VendorId),
      );
      let defaultSite = "";
      if (sites.length === 1) {
        defaultSite = sites[0].VendorSiteCode;
      }
      setFormData((prev) => ({
        ...prev,
        nameOfPayee: vendor.VendorName,
        oracleCode: String(vendor.VendorId),
        supplierSiteCode: defaultSite,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        nameOfPayee: "",
        oracleCode: "",
        supplierSiteCode: "",
      }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const validFiles = filesArray.filter(
        (file) =>
          file.type.startsWith("image/") || file.type === "application/pdf",
      );

      if (validFiles.length < filesArray.length) {
        showToast("Only PDF and Image files are allowed.", "warning");
      }

      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
  };

  const handleSubmit = async () => {
    if (!formData.nameOfPayee || !formData.amount) {
      showToast("Please fill in required fields (Payee and Amount)", "error");
      return;
    }

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        advance_adj: formData.advanceAdj ? parseFloat(formData.advanceAdj) : 0,
        tds_amount: formData.tdsAmount ? parseFloat(formData.tdsAmount) : 0,
        tds_percentage: formData.tdsPercentage
          ? parseFloat(formData.tdsPercentage)
          : 0,
        // Map frontend names to backend names if needed, but I've kept them mostly same or snake_case
        name_of_payee: formData.nameOfPayee,
        oracle_code: formData.oracleCode,
        supplier_site_code: formData.supplierSiteCode,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate
          ? formData.invoiceDate.format("YYYY-MM-DD")
          : null,
        particulars_of_payment: formData.particularsOfPayment,
        cjo_no: formData.cjoNo,
        po_wo_no: formData.poWoNo,
        date: formData.date ? formData.date.format("YYYY-MM-DD") : null,
        amount_in_words: formData.amountInWords,
        mode_of_payment: formData.modeOfPayment,
        tds_section: formData.tdsSection,
      };

      const result: any = await createBudgetaryPayment(payload).unwrap();
      const paymentId = result?.data?.id || result?.id;

      if (paymentId && selectedFiles.length > 0) {
        try {
          await uploadAttachments({
            id: paymentId,
            files: selectedFiles,
          }).unwrap();
        } catch (uploadErr) {
          console.error("Attachment upload failed:", uploadErr);
          showToast(
            "Voucher created, but some attachments failed to upload.",
            "warning",
          );
        }
      }

      showToast("Voucher Created Successfully!", "success");

      onClose();
      // Reset form
      setFormData({
        nameOfPayee: "",
        oracleCode: "",
        supplierSiteCode: "",
        invoiceNumber: "",
        invoiceDate: null as Dayjs | null,
        particularsOfPayment: "",
        cjoNo: "",
        date: dayjs() as Dayjs | null,
        poWoNo: "",
        amount: "",
        amountInWords: "",
        modeOfPayment: "RTGS",
        advanceAdj: "",
        tdsAmount: "",
        tdsSection: "",
        tdsPercentage: "",
        segment1: "",
        segment2: "",
        segment3: "",
        segment4: "",
      });
      setSelectedFiles([]);
    } catch (error: any) {
      showToast(error?.data?.message || "Failed to create voucher", "error");
    }
  };

  const sectionTitleStyle = {
    mb: 2,
    fontWeight: 700,
    color: "primary.main",
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: 1,
    "&::after": {
      content: '""',
      flex: 1,
      height: "1px",
      bgcolor: "divider",
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            backgroundImage: "none",
            boxShadow: "0 24px 48px -12px rgba(0,0,0,0.25)",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2.5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "background.paper" : "#ffffff",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: "text.primary" }}
          >
            Payment Voucher
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover", color: "error.main" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 3,
            pt: 4,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "background.default" : "#fcfcfc",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {/* --- Row 1: Payee, Supplier Code, Supplier Site Code, CJO --- */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 2,
              }}
            >
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <Autocomplete
                  size="small"
                  options={uniqueVendors}
                  loading={isVendorsLoading}
                  getOptionLabel={(option) => option.VendorName || ""}
                  value={
                    uniqueVendors.find(
                      (v) => String(v.VendorId) === formData.oracleCode,
                    ) || null
                  }
                  onChange={(_, newValue) => handleVendorSelect(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Name of Payee"
                      required
                      placeholder="Select payee"
                    />
                  )}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 6", md: "span 4" } }}>
                <Autocomplete
                  size="small"
                  options={uniqueVendors}
                  loading={isVendorsLoading}
                  getOptionLabel={(option) => String(option.VendorId) || ""}
                  value={
                    uniqueVendors.find(
                      (v) => String(v.VendorId) === formData.oracleCode,
                    ) || null
                  }
                  onChange={(_, newValue) => handleVendorSelect(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier Code"
                      placeholder="Code"
                    />
                  )}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 6", md: "span 4" } }}>
                <Autocomplete
                  size="small"
                  options={selectedVendorSites}
                  getOptionLabel={(option) => option.VendorSiteCode || ""}
                  value={
                    selectedVendorSites.find(
                      (s) => s.VendorSiteCode === formData.supplierSiteCode,
                    ) || null
                  }
                  onChange={(_, newValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplierSiteCode: newValue ? newValue.VendorSiteCode : "",
                    }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier Site Code"
                      placeholder="Site Code"
                    />
                  )}
                />
              </Box>
            </Box>

            {/* --- Row 2: CJO & Particulars --- */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 2,
              }}
            >
              <Box sx={{ gridColumn: { xs: "span 6", md: "span 3" } }}>
                <TextField
                  fullWidth
                  label="CJO No.#"
                  name="cjoNo"
                  value={formData.cjoNo}
                  onChange={handleChange}
                  size="small"
                  placeholder="No."
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 9" } }}>
                <TextField
                  fullWidth
                  label="Particulars of Payment"
                  name="particularsOfPayment"
                  value={formData.particularsOfPayment}
                  onChange={handleChange}
                  size="small"
                  placeholder="Describe the purpose of payment..."
                />
              </Box>
            </Box>

            {/* --- Row 3: Date, PO/WO, Mode --- */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 2,
              }}
            >
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(newValue) => handleDateChange("date", newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <TextField
                  fullWidth
                  label="PO/WO No.#"
                  name="poWoNo"
                  value={formData.poWoNo}
                  onChange={handleChange}
                  size="small"
                  placeholder="PO Number"
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <TextField
                  select
                  fullWidth
                  label="Mode of Payment"
                  name="modeOfPayment"
                  value={formData.modeOfPayment}
                  onChange={handleChange}
                  size="small"
                >
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="DD">DD</MenuItem>
                  <MenuItem value="RTGS">RTGS</MenuItem>
                  <MenuItem value="NEFT">NEFT</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* --- Row 4: Invoice Details & Total Amount --- */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 2,
              }}
            >
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  size="small"
                  placeholder="Inv No."
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <DatePicker
                  label="Invoice Date"
                  value={formData.invoiceDate}
                  onChange={(newValue) =>
                    handleDateChange("invoiceDate", newValue)
                  }
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Amount (Rs.)"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <Typography
                        sx={{ mr: 1, fontWeight: 700, color: "primary.main" }}
                      >
                        ₹
                      </Typography>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.paper",
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* --- Row 4.5: Segments (Division, Segment 3, 4, 5) --- */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 2,
                mt: 0.5,
              }}
            >
              <Box
                sx={{
                  gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" },
                }}
              >
                <Autocomplete
                  size="small"
                  options={segment1Options}
                  getOptionLabel={(option) =>
                    option ? `${option.Code} - ${option.Description}` : ""
                  }
                  value={
                    segment1Options.find(
                      (opt) => opt.Code === formData.segment1,
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      segment1: newValue ? newValue.Code : "",
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.Code === value.Code
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Segment 2" fullWidth />
                  )}
                />
              </Box>
              <Box
                sx={{
                  gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" },
                }}
              >
                <Autocomplete
                  size="small"
                  options={segment2Options}
                  getOptionLabel={(option) =>
                    option ? `${option.Code} - ${option.Description}` : ""
                  }
                  value={
                    segment2Options.find(
                      (opt) => opt.Code === formData.segment2,
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      segment2: newValue ? newValue.Code : "",
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.Code === value.Code
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Segment 3" fullWidth />
                  )}
                />
              </Box>
              <Box
                sx={{
                  gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" },
                }}
              >
                <Autocomplete
                  size="small"
                  options={segment3Options}
                  getOptionLabel={(option) =>
                    option ? `${option.Code} - ${option.Description}` : ""
                  }
                  value={
                    segment3Options.find(
                      (opt) => opt.Code === formData.segment3,
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      segment3: newValue ? newValue.Code : "",
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.Code === value.Code
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Segment 4" fullWidth />
                  )}
                />
              </Box>
              <Box
                sx={{
                  gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" },
                }}
              >
                <Autocomplete
                  size="small"
                  options={segment4Options}
                  getOptionLabel={(option) =>
                    option ? `${option.Code} - ${option.Description}` : ""
                  }
                  value={
                    segment4Options.find(
                      (opt) => opt.Code === formData.segment4,
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      segment4: newValue ? newValue.Code : "",
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.Code === value.Code
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Segment 5" fullWidth />
                  )}
                />
              </Box>
            </Box>

            {/* --- Row 6: Deductions (TDS Section) --- */}
            <Box
              sx={{
                p: 1.5,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "action.hover",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TextField
                  sx={{ width: "200px" }}
                  type="number"
                  label="Less: Advance Adj."
                  name="advanceAdj"
                  value={formData.advanceAdj}
                  onChange={handleChange}
                  size="small"
                />
                <Divider orientation="vertical" flexItem />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    Less : TDS (if any)
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    U/s.
                  </Typography>
                  <TextField
                    sx={{ width: "120px" }}
                    name="tdsSection"
                    value={formData.tdsSection}
                    onChange={handleChange}
                    size="small"
                    placeholder="e.g. 194C"
                  />
                  <Typography variant="body2">@</Typography>
                  <TextField
                    sx={{ width: "80px" }}
                    name="tdsPercentage"
                    value={formData.tdsPercentage}
                    onChange={handleChange}
                    size="small"
                    placeholder="%"
                    InputProps={{
                      endAdornment: (
                        <Typography variant="caption">%</Typography>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* --- Supporting Documents (Attachments) --- */}
            <Box sx={{ mt: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ ...sectionTitleStyle, mb: 1.5, color: "text.primary" }}
              >
                Supporting Documents (Attachments)
              </Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  sx={{
                    borderStyle: "dashed",
                    borderWidth: "2px",
                    height: "100px",
                    width: "150px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    borderColor: "divider",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Upload Files
                  <input
                    type="file"
                    multiple
                    hidden
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                </Button>

                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, flex: 1 }}
                >
                  {selectedFiles.map((file, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 1,
                        px: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        bgcolor: "background.paper",
                        borderRadius: "8px",
                        maxWidth: "200px",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                        }}
                      >
                        {file.name}
                      </Typography>
                      <Box sx={{ display: "flex", ml: "auto" }}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "background.paper" : "#ffffff",
            borderTop: 1,
            borderColor: "divider",
            gap: 2,
          }}
        >
          <LoadingButton
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            loading={isSubmitting}
            sx={{
              py: 1.2,
              borderRadius: "6px",
              fontWeight: 700,
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Submit Voucher
          </LoadingButton>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
              py: 1.2,
              borderRadius: "6px",
              fontWeight: 600,
              color: "text.secondary",
              borderColor: "divider",
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BudgetaryPaymentModal;
