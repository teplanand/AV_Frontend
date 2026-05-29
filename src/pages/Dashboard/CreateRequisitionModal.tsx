import React, { useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Box,
  Dialog,
  DialogContent,
  Button,
  TextField,
  MenuItem,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  Checkbox,
  IconButton,
  Tooltip,
  InputAdornment,
  Autocomplete,
  useTheme,
  Chip,
  CircularProgress,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { useToast } from "../../hooks/useToast";
import {
  useListSuppliersQuery,
  useCreateSupplierMutation,
  useSyncVendorsMutation,
} from "../../redux/api/suppliers";
import { 
  useCreateRequisitionMutation,
  useGetNextRefCodeQuery,
  useUploadRequisitionAttachmentsMutation,
} from "../../redux/api/requisitions";
import {
  useInitiateWorkflowMutation,
  useLazyGetPoDetailsQuery,
  useLazyGetInvoiceBreakthroughQuery,
  useLazyGetGlDivisionQuery,
} from "../../redux/api/workflow";
import { LoadingButton } from "@mui/lab";

interface CreateRequisitionModalProps {
  open: boolean;
  onClose: () => void;
}

interface POItem {
  id: number;
  pr: string;
  poProduct: string;
  description: string;
  productPrice: number;
  productQty: number;
  pendingQty: number;
  currency: string;
  poAmount: number;
  updatedQty: number;
  updatedAmount: number;
  buyer: string;
  selected: boolean;
  idInternal: number;
  accountingDate?: string;
}

const MOCK_SUPPLIERS = [
  {
    code: "SUP001",
    name: "Tech Solutions",
    address: "123 Tech Park, Silicon Valley, CA",
    type: "Service",
    defaultSite: "Mumbai HQ",
  },
  {
    code: "SUP002",
    name: "Global Parts Inc",
    address: "45 Industrial Area, New York, NY",
    type: "Manufacturing",
    defaultSite: "New York Plant",
  },
  {
    code: "SUP003",
    name: "Logic Systems",
    address: "789 Innovation Hub, London, UK",
    type: "IT",
    defaultSite: "London Office",
  },
];

const CreateRequisitionModal: React.FC<CreateRequisitionModalProps> = ({
  open,
  onClose,
}) => {
  const { showToast } = useToast();
  const theme = useTheme();

  // --- API ---
  const SUPPLIER_PAGE_SIZE = 30;
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierInputValue, setSupplierInputValue] = useState("");
  const [supplierPage, setSupplierPage] = useState(0);
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [supplierHasMore, setSupplierHasMore] = useState(true);
  const [selectedSupplierObj, setSelectedSupplierObj] = useState<any>(null);

  // Debounced search — reset to page 0 when search term changes
  const [debouncedSupplierSearch, setDebouncedSupplierSearch] = useState("");
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSupplierSearch(supplierSearch);
      setSupplierPage(0);
      setSupplierOptions([]);
      setSupplierHasMore(true);
    }, 400);
    return () => clearTimeout(t);
  }, [supplierSearch]);

  const { data: suppliersPageData, isFetching: isSuppliersLoading } = useListSuppliersQuery({
    skip: supplierPage * SUPPLIER_PAGE_SIZE,
    limit: SUPPLIER_PAGE_SIZE,
    search: debouncedSupplierSearch,
  }, { skip: !open });

  // Append new page of options (avoid duplicates)
  React.useEffect(() => {
    const items: any[] = (suppliersPageData as any)?.data?.data || [];
    if (supplierPage === 0) {
      setSupplierOptions(items);
    } else {
      setSupplierOptions((prev) => {
        const ids = new Set(prev.map((s: any) => s.id));
        return [...prev, ...items.filter((s: any) => !ids.has(s.id))];
      });
    }
    setSupplierHasMore(items.length === SUPPLIER_PAGE_SIZE);
  }, [suppliersPageData]);

  const [createRequisition, { isLoading: isSubmitting }] =
    useCreateRequisitionMutation();
  const [uploadAttachments] = useUploadRequisitionAttachmentsMutation();
  const [initiateWorkflow] = useInitiateWorkflowMutation();
  const [getPoDetails, { isFetching: isPoLoading }] =
    useLazyGetPoDetailsQuery();
  const [getInvoiceBreakthrough] = useLazyGetInvoiceBreakthroughQuery();
  const [getGlDivision] = useLazyGetGlDivisionQuery();
  const [createSupplier] = useCreateSupplierMutation();
  const [syncVendors, { isLoading: isSyncing }] = useSyncVendorsMutation();
  const { data: nextRefResponse } = useGetNextRefCodeQuery(undefined, { skip: !open });
  const nextRefCode = nextRefResponse?.data?.next_code || "Loading...";

  // --- State ---
  const [requestType, setRequestType] = useState<"PO" | "NON-PO">("PO");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [supplier, setSupplier] = useState("");
  const [supplierSite, setSupplierSite] = useState("");
  const [vendorSiteId, setVendorSiteId] = useState<number | null>(null);
  const [reqDate, setReqDate] = useState<Dayjs | null>(dayjs());
  const [settlementDate, setSettlementDate] = useState<Dayjs | null>(dayjs());
  const [division, setDivision] = useState("");
  const [product, setProduct] = useState("");
  const [divisionOptions, setDivisionOptions] = useState<Array<{ Code: string; Description: string }>>([]);
  // PO Section State
  const [poNumberInput, setPoNumberInput] = useState("");
  const [isTableVisible, setIsTableVisible] = useState(false);

  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [poHeaderData, setPoHeaderData] = useState<any>(null);
  const [remarks, setRemarks] = useState("");

  const [breakthroughData, setBreakthroughData] = useState<any[] | null>(null);
  const [isBreakthroughOpen, setIsBreakthroughOpen] = useState(false);
  const [isBreakthroughLoading, setIsBreakthroughLoading] = useState(false);

  // --- Reset Form on Open ---
  React.useEffect(() => {
    if (open) {
      setRequestType("PO");
      setSupplier("");
      setSupplierSite("");
      setVendorSiteId(null);
      setSelectedSupplierObj(null);
      setSupplierSearch("");
      setSupplierInputValue("");
      setSupplierPage(0);
      setSupplierOptions([]);
      setSupplierHasMore(true);
      setReqDate(dayjs());
      setSettlementDate(dayjs());
      setPoNumberInput("");
      setIsTableVisible(false);
      setPoItems([]);
      setPoHeaderData(null);
      setRemarks("");
      setBreakthroughData(null);
      setIsBreakthroughOpen(false);
      setIsBreakthroughLoading(false);
      setSelectedFiles([]);
      setNonPoItems([
        {
          id: Date.now(),
          description: "",
          requestAmount: "",
          remarks: "",
          accountingDate: dayjs().format("YYYY-MM-DD"),
        },
      ]);
      setTaxConfig({
        taxPercent: 18,
        applyTax: true,
      });
      setDivision("");
      setProduct("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const fetchDivision = async () => {
      try {
        const data = await getGlDivision({}).unwrap();
        setDivisionOptions(data);
      } catch (err) {
        console.error("Failed to fetch division:", err);
      }
    };
    fetchDivision();
  }, [open]);

  const [nonPoItems, setNonPoItems] = useState([
    {
      id: Date.now(),
      description: "",
      requestAmount: "",
      remarks: "",
      accountingDate: dayjs().format("YYYY-MM-DD"),
    },
  ]);

  const [taxConfig, setTaxConfig] = useState({
    taxPercent: 18,
    applyTax: true,
  });

  // Additional
  const [openingBalance, setOpeningBalance] = useState(0);
  const [includeOpeningBalance, setIncludeOpeningBalance] = useState(false);

  // --- Computed Values ---

  const totalSelectedAmount = useMemo(() => {
    if (requestType === "PO") {
      return poItems
        .filter((i) => i.selected)
        .reduce((acc, curr) => acc + curr.updatedAmount, 0);
    } else {
      return nonPoItems.reduce(
        (acc, curr) => acc + (Number(curr.requestAmount) || 0),
        0,
      );
    }
  }, [poItems, nonPoItems, requestType]);

  const taxAmount = useMemo(() => {
    return taxConfig.applyTax
      ? (totalSelectedAmount * taxConfig.taxPercent) / 100
      : 0;
  }, [totalSelectedAmount, taxConfig.applyTax, taxConfig.taxPercent]);

  const totalPayable = useMemo(() => {
    let base = totalSelectedAmount + taxAmount;
    if (includeOpeningBalance) {
      base += openingBalance;
    }
    return base;
  }, [totalSelectedAmount, taxAmount, includeOpeningBalance, openingBalance]);

  // --- Handlers ---

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

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setPoItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const handleToggleItem = (id: number) => {
    setPoItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  // --- Non-PO Handlers ---
  const handleAddNonPoRow = () => {
    setNonPoItems([
      ...nonPoItems,
      {
        id: Date.now(),
        description: "",
        requestAmount: "",
        remarks: "",
        accountingDate: dayjs().format("YYYY-MM-DD"),
      },
    ]);
  };

  const handleRemoveNonPoRow = (id: number) => {
    if (nonPoItems.length > 1) {
      setNonPoItems(nonPoItems.filter((item) => item.id !== id));
    }
  };

  const handleUpdateNonPoRow = (id: number, field: string, value: any) => {
    setNonPoItems(
      nonPoItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleUpdatePoRow = (id: number, field: string, value: any) => {


    setPoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleQtyChange = (id: number, val: string) => {
    const qty = Number(val);
    if (qty < 0) return;

    setPoItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const remainingQty = item.productQty; // Now productQty IS the balance
          if (qty > remainingQty) {
            showToast(
              `Quantity cannot exceed balance PO quantity (${remainingQty})`,
              "warning",
            );
            return item;
          }
          const unitPrice = item.productPrice;
          return {
            ...item,
            selected: qty > 0 ? true : item.selected,
            updatedQty: qty,
            updatedAmount: qty * unitPrice,
          };
        }
        return item;
      }),
    );
  };

  const handleGetPODetails = async () => {
    if (!poNumberInput) {
      showToast("Please enter a PO Number", "warning");
      return;
    }

    try {
      const response: any = await getPoDetails({
        po_no: poNumberInput,
      }).unwrap();

      // The API response structure: { success: true, message: "...", data: { Header: {...}, Lines: [...] } }
      const poData = response?.data;

      if (poData && poData.Lines && Array.isArray(poData.Lines)) {
        const header = poData.Header || {};
        const lines = poData.Lines;
        setPoHeaderData(header);
        setOpeningBalance(Number(header.OPENING_BALANCE) || 0);
        setIncludeOpeningBalance(false);

        if (header.VENDOR_ID) {
          setIsBreakthroughLoading(true);
          getInvoiceBreakthrough({
            AppToken: "abcd",
            UserName: "",
            ClientIP: "::1",
            data: {
              VENDOR_ID: header.VENDOR_ID
            },
            Other: {
              doLog: true,
              whCon: "1=1"
            }
          })
            .unwrap()
            .then((data) => {
              setBreakthroughData(data);
            })
            .catch((err) => {
              console.error("Failed to fetch invoice breakthrough details:", err);
            })
            .finally(() => {
              setIsBreakthroughLoading(false);
            });
        } else {
          setBreakthroughData(null);
        }        // Find matching supplier in local DB (from already-loaded options)
        let matchedSupplier = supplierOptions.find(
          (s: any) =>
            (header.VENDOR_ID &&
              String(s.supplier_code) === String(header.VENDOR_ID)) ||
            (header.VENDOR_NAME &&
              s.supplier_name?.toLowerCase() ===
                header.VENDOR_NAME?.toLowerCase()) ||
            (header.VENDOR_ID && s.id === header.VENDOR_ID),
        );

        let finalSupplierId = null;

        if (matchedSupplier) {
          finalSupplierId = matchedSupplier.id;
          setSelectedSupplierObj(matchedSupplier);
        } else if (header.VENDOR_ID || header.VENDOR_NAME) {
          // New supplier from external source - attempt to register in local database
          try {
            const newSupplierPayload = {
              supplier_code: String(header.VENDOR_ID || `EXT-${Date.now()}`),
              supplier_name: header.VENDOR_NAME || "New Supplier",
              supplier_address:
                `${header.ADDRESS_LINE1 || ""} ${header.ADDRESS_LINE2 || ""}`.trim(),
              supplier_type: header.SUPPLIER_TYPE || "Vendor",
              is_active: true,
            };

            const createResult: any =
              await createSupplier(newSupplierPayload).unwrap();
            // Flexible ID extraction
            finalSupplierId =
              createResult?.data?.id ||
              createResult?.id ||
              (createResult as any)?.id;

            if (finalSupplierId) {
              // Build a local obj so address/type fields show immediately
              setSelectedSupplierObj({
                id: finalSupplierId,
                supplier_code: newSupplierPayload.supplier_code,
                supplier_name: newSupplierPayload.supplier_name,
                supplier_address: newSupplierPayload.supplier_address,
                supplier_type: newSupplierPayload.supplier_type,
              });
              showToast(
                `New supplier ${header.VENDOR_NAME} successfully registered`,
                "success",
              );
            }
          } catch (err: any) {
            console.error("Auto-supplier creation failed:", err);

            // Fallback: try one more time in currently loaded options
            const retryMatch = supplierOptions.find(
              (s: any) =>
                (header.VENDOR_ID &&
                  String(s.supplier_code) === String(header.VENDOR_ID)) ||
                (header.VENDOR_NAME &&
                  s.supplier_name?.toLowerCase() ===
                    header.VENDOR_NAME?.toLowerCase()),
            );

            if (retryMatch) {
              finalSupplierId = retryMatch.id;
              setSelectedSupplierObj(retryMatch);
            } else {
              showToast(
                "Matched PO supplier but failed to register locally",
                "warning",
              );
            }
          }
        }

        if (finalSupplierId) {
          setSupplier(finalSupplierId);
          setSupplierSite(header.VENDOR_SITE_CODE || "");
          setVendorSiteId(header.VENDOR_SITE_ID || null);
        } else if (header.VENDOR_ID || header.VENDOR_NAME) {
          // Only show this if we had a vendor to work with but couldn't get an ID
          showToast(
            "Could not identify supplier ID in local system",
            "warning",
          );
        } else {
          showToast("Supplier info missing in PO details", "warning");
        }

        const mappedItems: POItem[] = lines.map((item: any, index: number) => {
          const qty = item.Quantity || 0;
          const price = item.Unit_Price || 0;
          const total = qty * price;
          const pending = item.pending_qty || 0;
          const remaining = qty - pending;

          return {
            id: item.PO_Line_Id || index + 1,
            idInternal: item.item_id_internal,
            pr: String(item.Line_Num) || "N/A",
            poProduct: String(item.Item_Id) || "N/A",
            description: item.Item_Description || "N/A",
            productQty: remaining > 0 ? remaining : 0,
            pendingQty: pending,
            productPrice: price,
            currency: header.CURRENCY || "INR",
            poAmount: total,
            updatedQty: 0,
            updatedAmount: 0,
            buyer: header.CREATED_BY_NAME || "N/A",
            selected: false,
            accountingDate: dayjs().format("YYYY-MM-DD"),
          };
        });

        setPoItems(mappedItems);
        setIsTableVisible(true);
        showToast("PO Details fetched successfully", "success");
      } else {
        showToast("No details found for this PO", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to fetch PO details", "error");
    }
  };

  const handleRefreshSupplier = async () => {
    try {
      const result: any = await syncVendors({}).unwrap();
      const {
        inserted = 0,
        updated = 0,
        unique_vendors = 0,
        total_from_api = 0,
      } = result?.data || {};
      showToast(
        `Sync done! ${inserted} new suppliers added, ${updated} updated. (${unique_vendors} unique vendors from ${total_from_api} API records)`,
        "success",
      );
    } catch (err: any) {
      showToast(
        err?.data?.message || "Failed to sync suppliers from external API",
        "error",
      );
    }
  };

  const handleSubmit = async () => {
    if (!supplier) {
      showToast("Please select a supplier.", "error");
      return;
    }

    // For PO based, ensure we have a PO number and items
    if (requestType === "PO" && (!poNumberInput || totalSelectedAmount <= 0)) {
      showToast(
        "Please enter a PO Number and select at least one item.",
        "error",
      );
      return;
    }

    try {
      // Extract company and division from cookies or default
      // For demonstration, using defaults 1
      const companyId = 1;
      const divisionId = 1;

      // PO: 1, Non-PO: 2
      const wfDivId = requestType === "PO" ? 1 : 2;

      const payload = {
        req_ref_code: nextRefCode,
        req_date: reqDate ? reqDate.format("YYYY-MM-DD") : null,
        settlement_date: settlementDate
          ? settlementDate.format("YYYY-MM-DD")
          : null,
        supplier_id: supplier,
        supplier_site: supplierSite,
        vendor_site_id: vendorSiteId,
        is_po: requestType === "PO",
        po_id: requestType === "PO" ? parseInt(poNumberInput) || null : null,
        req_qty:
          requestType === "PO"
            ? poItems.reduce(
                (acc, i) => acc + (i.selected ? i.updatedQty : 0),
                0,
              )
            : nonPoItems.length,
        req_amount: totalSelectedAmount,
        gst: taxAmount,
        amount: totalPayable,
        remarks: remarks,
        payment_status: "pending",
        PAYMENT_TERMS: requestType === "PO" ? (poHeaderData?.PAYMENT_TERMS || "N/A") : "N/A",
        division: division,
        product: product,

        // Workflow & Transaction related
        wf_div_id: wfDivId,
        company_id: companyId,
        division_id: divisionId,
        opening_balance: openingBalance,
        is_opening_balance_included: includeOpeningBalance,
        items:
          requestType === "PO"
            ? poItems
                .filter((i) => i.selected)
                .map((i) => ({
                  po_details_id: i.idInternal,
                  req_qty: i.updatedQty,
                  req_amount: i.updatedAmount,
                  description: i.description,
                  accounting_date: i.accountingDate,
                }))
            : nonPoItems.map((i) => ({
                po_details_id: null,
                description: i.description,
                req_qty: 1,
                req_amount: i.requestAmount,
                remarks: i.remarks,
                accounting_date: i.accountingDate,
              })),
      };

      const result: any = await createRequisition(payload).unwrap();
      const requisitionId = result?.data?.requisition?.id;

      if (requisitionId && selectedFiles.length > 0) {
        try {
          await uploadAttachments({
            id: requisitionId,
            files: selectedFiles,
          }).unwrap();
        } catch (uploadErr) {
          console.error("Attachment upload failed:", uploadErr);
          showToast(
            "Requisition created, but some attachments failed to upload.",
            "warning",
          );
        }
      }

      const wfStatus = result?.data?.workflow;

      if (wfStatus?.WF_INSTANCE_ID) {
        showToast(
          `Requisition Created and Workflow ${wfStatus.WF_INSTANCE_ID} Initiated!`,
          "success",
        );
      } else {
        showToast("Requisition Created successfully!", "success");
      }

      onClose();

      // Reset local state if needed
      setSupplier("");
      setSupplierSite("");
      setVendorSiteId(null);
      setPoNumberInput("");
      setIsTableVisible(false);
    } catch (error: any) {
      showToast(
        error?.data?.message || "Failed to create requisition",
        "error",
      );
    }
  };

  // Helper styles for consistency
  const paperStyle = {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  };
  const defaultBgStyle = {
    backgroundColor: theme.palette.background.default,
  };
  const borderStyle = {
    borderColor: theme.palette.divider,
  };

  // Check selection state
  const isAllSelected =
    poItems.length > 0 && poItems.every((item) => item.selected);
  const isIndeterminate =
    poItems.some((item) => item.selected) && !isAllSelected;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "4px",
            overflow: "hidden",
            ...paperStyle, // STRICT THEME COLOR
          },
        }}
      >
        {/* --- Dialog Title --- */}
        <Box
          className="flex justify-between items-center p-4 border-b"
          sx={{ ...paperStyle, ...borderStyle }}
        >
          <div>
            <Typography variant="h6" fontWeight={700}>
              Create Requisition
            </Typography>
          </div>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            bgcolor: "background.default",
          }}
        >
          {/* --- Top Fixed Header Section --- */}
          <Box
            className="p-4 border-b shadow-sm z-10"
            sx={{ ...paperStyle, ...borderStyle }}
          >
            <div className="grid grid-cols-12 gap-x-4 gap-y-6">
              {/* Row 1: PR, Date, Settlement, Type, PO Number */}
              <div className="col-span-12 md:col-span-2">
                <TextField
                  fullWidth
                  label="PR Ref No"
                  name="req_ref_code"
                  value={nextRefCode}
                  disabled
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                />
              </div>
              <div className="col-span-12 md:col-span-2">
                <DatePicker
                  label="Requisition Date"
                  value={reqDate}
                  readOnly
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      disabled: true,
                    },
                  }}
                />
              </div>
              <div className="col-span-12 md:col-span-2">
                <DatePicker
                  label="Settlement Date"
                  value={settlementDate}
                  onChange={(newValue) => setSettlementDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                    },
                  }}
                />
              </div>

              <div className="col-span-12 md:col-span-3 flex items-center">
                <div className="flex items-center gap-2">
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: "bold",
                      color: "text.secondary",
                      mr: 1,
                    }}
                  >
                    Type:
                  </Typography>
                  <RadioGroup
                    row
                    value={requestType}
                    onChange={(e) => {
                      const newType = e.target.value as "PO" | "NON-PO";
                      setRequestType(newType);
                      // Clear all PO-fetched data when switching to NON-PO
                      if (newType === "NON-PO") {
                        setPoNumberInput("");
                        setPoItems([]);
                        setPoHeaderData(null);
                        setIsTableVisible(false);
                        setSupplier("");
                        setSupplierSite("");
                        setVendorSiteId(null);
                        setSelectedSupplierObj(null);
                        setSupplierInputValue("");
                        setSupplierSearch("");
                        setOpeningBalance(0);
                        setIncludeOpeningBalance(false);
                        setBreakthroughData(null);
                      }
                    }}
                  >
                    <FormControlLabel
                      value="PO"
                      control={<Radio size="small" />}
                      label={
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.8125rem" }}
                        >
                          PO
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      value="NON-PO"
                      control={<Radio size="small" />}
                      label={
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.8125rem" }}
                        >
                          Non-PO
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </div>
              </div>

              <div className="col-span-12 md:col-span-3">
                {requestType === "PO" && (
                  <div className="flex items-center gap-2">
                    <TextField
                      label="PO Number"
                      size="small"
                      value={poNumberInput}
                      onChange={(e) => setPoNumberInput(e.target.value)}
                      fullWidth
                    />
                    <LoadingButton
                      variant="contained"
                      size="medium"
                      onClick={handleGetPODetails}
                      loading={isPoLoading}
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 700,
                        px: 2,
                        minWidth: "60px",
                        "&:hover": { bgcolor: "primary.dark" },
                      }}
                    >
                      Get
                    </LoadingButton>
                  </div>
                )}
              </div>

              {/* Row 2: Supplier Details */}
              <div className="col-span-12 md:col-span-3 flex items-center gap-2">
                <Autocomplete
                  options={supplierOptions}
                  getOptionLabel={(option: any) =>
                    option
                      ? `${option.supplier_name || ""} (${option.supplier_code || ""})`
                      : ""
                  }
                  isOptionEqualToValue={(option: any, value: any) =>
                    option?.id === value?.id
                  }
                  filterOptions={(x) => x} // server-side filtering — disable client filter
                  loading={isSuppliersLoading}
                  value={selectedSupplierObj}
                  inputValue={supplierInputValue}
                  onInputChange={(_, value, reason) => {
                    setSupplierInputValue(value);
                    if (reason === "input") {
                      setSupplierSearch(value);
                    }
                  }}
                  onChange={(_, newValue: any) => {
                    setSupplier(newValue ? newValue.id : "");
                    setSelectedSupplierObj(newValue || null);
                    setSupplierSite(
                      newValue ? newValue.supplier_address || "" : "",
                    );
                  }}
                  fullWidth
                  disabled={requestType === "PO" && isTableVisible}
                  noOptionsText={
                    isSuppliersLoading
                      ? "Searching..."
                      : supplierSearch
                      ? `No suppliers found for "${supplierSearch}"`
                      : "No suppliers. Click 🔄 to sync from ERP."
                  }
                  ListboxProps={{
                    onScroll: (event: React.SyntheticEvent) => {
                      const el = event.currentTarget as HTMLUListElement;
                      const nearBottom =
                        el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
                      if (nearBottom && !isSuppliersLoading && supplierHasMore) {
                        setSupplierPage((prev) => prev + 1);
                      }
                    },
                    style: { maxHeight: 280 },
                  }}
                  renderOption={(props, option: any) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ py: 0.25 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ lineHeight: 1.3 }}
                        >
                          {option.supplier_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ lineHeight: 1.2 }}
                        >
                          #{option.supplier_code}
                          {option.supplier_type
                            ? ` • ${option.supplier_type}`
                            : ""}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier Name / Code"
                      size="small"
                      placeholder="Type to search..."
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSuppliersLoading ? (
                              <CircularProgress color="inherit" size={14} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Tooltip title="Sync all vendors from ERP">
                  <IconButton
                    onClick={handleRefreshSupplier}
                    disabled={isSyncing}
                    size="small"
                    sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
                  >
                    {isSyncing ? (
                      <CircularProgress size={16} color="primary" />
                    ) : (
                      <RefreshIcon fontSize="small" color="primary" />
                    )}
                  </IconButton>
                </Tooltip>
              </div>

              <div className="col-span-12 md:col-span-3">
                {(() => {
                  const addressValue =
                    requestType === "PO" && poHeaderData
                      ? `${poHeaderData.ADDRESS_LINE1 || ""} ${poHeaderData.ADDRESS_LINE2 || ""}`.trim()
                      : selectedSupplierObj?.supplier_address || "";
                  return (
                    <Tooltip title={addressValue} placement="top" arrow>
                      <TextField
                        fullWidth
                        label="Supplier Address"
                        value={addressValue}
                        disabled
                        size="small"
                        multiline
                        maxRows={2}
                        InputProps={{ readOnly: true }}
                        inputProps={{
                          style: {
                            padding: "4px 0",
                            lineHeight: "1.4",
                          },
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: theme.palette.action.hover,
                            alignItems: "flex-start",
                            paddingTop: "6px",
                            paddingBottom: "5px",
                          },
                          "& .MuiInputBase-input": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    </Tooltip>
                  );
                })()}
              </div>

              <div className="col-span-12 md:col-span-3">
                <TextField
                  fullWidth
                  label="Supplier Type"
                  value={
                    requestType === "PO" && poHeaderData
                      ? poHeaderData.SUPPLIER_TYPE || ""
                      : selectedSupplierObj?.supplier_type || ""
                  }
                  disabled
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <TextField
                  fullWidth
                  label="Supplier Site"
                  value={supplierSite}
                  onChange={(e) => setSupplierSite(e.target.value)}
                  size="small"
                  placeholder="Enter Site..."
                  disabled={requestType === "PO" && isTableVisible}
                />
              </div>

              {requestType === "PO" ? (
                <>
                  <div className="col-span-12 md:col-span-6">
                    <TextField
                      fullWidth
                      label="Remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      size="small"
                      placeholder="Enter any general remarks for this requisition..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "inherit",
                        },
                      }}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <TextField
                      fullWidth
                      label="Payment Terms"
                      value={poHeaderData?.PAYMENT_TERMS || "N/A"}
                      disabled
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="col-span-12 md:col-span-9">
                  <TextField
                    fullWidth
                    label="Remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    size="small"
                    placeholder="Enter any general remarks for this requisition..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "inherit",
                      },
                    }}
                  />
                </div>
              )}

              <div className="col-span-12 md:col-span-6">
                <Autocomplete
                  size="small"
                  options={divisionOptions}
                  getOptionLabel={(option) => option ? `${option.Code} - ${option.Description}` : ""}
                  value={divisionOptions.find(opt => `${opt.Code} - ${opt.Description}` === division || opt.Code === division) || null}
                  onChange={(_, newValue) => {
                    setDivision(newValue ? `${newValue.Code} - ${newValue.Description}` : "");
                  }}
                  isOptionEqualToValue={(option, value) => option.Code === value.Code}
                  renderInput={(params) => (
                    <TextField {...params} label="Division" fullWidth />
                  )}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <TextField
                  fullWidth
                  label="Product"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  size="small"
                  placeholder="Enter Product..."
                />
              </div>

              {/* --- Supporting Documents (Attachments) --- */}
              <div className="col-span-12">
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ 
                      mb: 1.5, 
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
                     }}
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
                        height: "64px",
                        width: "120px",
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
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, flex: 1, maxHeight: "64px", overflowY: "auto" }}
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
                            height: "fit-content"
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
              </div>

              </div>

          </Box>

          {/* --- Main Content Split --- */}
          <Box className="flex flex-1" sx={defaultBgStyle}>
            {/* Left: Table Section */}
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              {requestType === "PO" && isTableVisible ? (
                <Box
                  className="flex-1 flex flex-col overflow-hidden rounded-lg shadow-sm"
                  sx={{
                    ...paperStyle,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <TableContainer className="flex-1 overflow-y-auto">
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            padding="checkbox"
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            <Checkbox
                              size="small"
                              checked={isAllSelected}
                              indeterminate={isIndeterminate}
                              onChange={handleSelectAll}
                            />
                          </TableCell>
                          <TableCell
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            Product
                          </TableCell>
                          <TableCell
                            sx={{ bgcolor: "grey.100", fontWeight: 700, minWidth: 200 }}
                          >
                            Description
                          </TableCell>
                          <TableCell
                            sx={{ bgcolor: "grey.100", fontWeight: 700, width: 130 }}
                          >
                            Acct. Date
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ bgcolor: "grey.100", fontWeight: 700, px: 0.5 }}
                          >
                            Price
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ bgcolor: "grey.100", fontWeight: 700, px: 0.5 }}
                          >
                            PO Qty
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ bgcolor: "grey.100", fontWeight: 700, px: 0.5 }}
                          >
                            Pending
                          </TableCell>
                          <TableCell
                            align="center"
                            width={80}
                            sx={{ bgcolor: "grey.100", fontWeight: 700, px: 0.5 }}
                          >
                            Req Qty
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            Req Amt
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {poItems.map((row) => (
                          <TableRow
                            key={row.id}
                            hover
                            selected={row.selected}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={row.selected}
                                onChange={() => handleToggleItem(row.id)}
                                color="primary"
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                              }}
                            >
                              {row.poProduct}
                            </TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={row.description}
                                onChange={(e) =>
                                  handleUpdatePoRow(
                                    row.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                sx={{ minWidth: 200 }}
                              />
                            </TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <DatePicker
                                value={
                                  row.accountingDate
                                    ? dayjs(row.accountingDate)
                                    : null
                                }
                                onChange={(newValue) =>
                                  handleUpdatePoRow(
                                    row.id,
                                    "accountingDate",
                                    newValue
                                      ? newValue.format("YYYY-MM-DD")
                                      : null,
                                  )
                                }
                                format="DD/MM/YYYY"
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                    sx: { minWidth: 120 },
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {row.productPrice.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {row.productQty}
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                color={
                                  row.pendingQty > 0
                                    ? "warning.main"
                                    : "text.secondary"
                                }
                              >
                                {row.pendingQty}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ p: 1 }}>
                              <div className="flex justify-center">
                                <input
                                  type="number"
                                  className={`w-[60px] p-1 text-[0.875rem] border border-divider rounded ${row.selected ? "bg-paper text-textPrimary" : "bg-actionHover text-textPrimary"}`}
                                  value={row.updatedQty}
                                  onChange={(e) =>
                                    handleQtyChange(row.id, e.target.value)
                                  }
                                  onFocus={(e) => e.target.select()}
                                  disabled={!row.selected}
                                />
                              </div>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 600,
                                color: row.selected
                                  ? "primary.main"
                                  : "text.disabled",
                              }}
                            >
                              {row.updatedAmount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : requestType === "NON-PO" ? (
                <Box
                  className="flex-1 flex flex-col overflow-hidden rounded-lg shadow-sm"
                  sx={{
                    ...paperStyle,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <TableContainer className="flex-1 overflow-y-auto">
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            width="40%"
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            Description / Service
                          </TableCell>

                          <TableCell
                            width="120px"
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            Acct. Date
                          </TableCell>

                          <TableCell
                            align="right"
                            width="20%"
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            Req. Amount
                          </TableCell>

                          <TableCell
                            width="30%"
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            Remarks
                          </TableCell>
                          <TableCell
                            width="10%"
                            align="center"
                            sx={{ bgcolor: "grey.100", fontWeight: 700 }}
                          >
                            <IconButton
                              size="small"
                              onClick={handleAddNonPoRow}
                              color="primary"
                            >
                              <AddIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {nonPoItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell sx={{ p: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Enter Item Description"
                                value={item.description}
                                onChange={(e) =>
                                  handleUpdateNonPoRow(
                                    item.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell sx={{ p: 1 }}>
                              <DatePicker
                                value={
                                  item.accountingDate
                                    ? dayjs(item.accountingDate)
                                    : null
                                }
                                onChange={(newValue) =>
                                  handleUpdateNonPoRow(
                                    item.id,
                                    "accountingDate",
                                    newValue
                                      ? newValue.format("YYYY-MM-DD")
                                      : null,
                                  )
                                }
                                format="DD/MM/YYYY"
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                    sx: { minWidth: 120 },
                                  },
                                }}
                              />
                            </TableCell>

                            <TableCell align="right" sx={{ p: 1 }}>
                              <TextField
                                size="small"
                                type="number"
                                placeholder="0.00"
                                value={item.requestAmount}
                                onChange={(e) =>
                                  handleUpdateNonPoRow(
                                    item.id,
                                    "requestAmount",
                                    e.target.value,
                                  )
                                }
                                onFocus={(e) => e.target.select()}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      ₹
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Remarks..."
                                value={item.remarks}
                                onChange={(e) =>
                                  handleUpdateNonPoRow(
                                    item.id,
                                    "remarks",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ p: 1 }}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveNonPoRow(item.id)}
                                disabled={nonPoItems.length <= 1}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Box
                  className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl"
                  sx={{
                    borderColor: "divider",
                    backgroundColor: "action.hover",
                  }}
                >
                  <SearchIcon
                    sx={{
                      fontSize: 48,
                      opacity: 0.2,
                      mb: 1,
                      color: theme.palette.text.secondary,
                    }}
                  />
                  <Typography variant="body1" color="textSecondary">
                    Enter PO Number & Click 'Get' to view items
                  </Typography>
                </Box>
              )}

            </div>

            {/* Right: Summary Sidebar */}
            <Box
              className="w-80 p-5 flex flex-col justify-between shadow-lg z-20"
              sx={{
                ...paperStyle,
                borderLeft: 1,
                borderColor: "divider",
              }}
            >
              <div>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Summary
                </Typography>

                <Box
                  className="p-4 rounded-lg border mb-6 space-y-3"
                  sx={{
                    backgroundColor: "background.default",
                    borderColor: "divider",
                  }}
                >
                  <div className="flex justify-between items-center text-sm">
                    <Typography
                      component="span"
                      sx={{ color: "text.secondary" }}
                    >
                      Selected Items
                    </Typography>
                    <Typography component="span" sx={{ fontWeight: 600 }}>
                      {poItems.filter((i) => i.selected).length}
                    </Typography>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <Typography
                      component="span"
                      sx={{ color: "text.secondary" }}
                    >
                      Net Amount
                    </Typography>
                    <Typography component="span" sx={{ fontWeight: 600 }}>
                      {totalSelectedAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={taxConfig.applyTax}
                            onChange={(e) =>
                              setTaxConfig({
                                ...taxConfig,
                                applyTax: e.target.checked,
                              })
                            }
                          />
                        }
                        label={
                          <Typography variant="body2" color="text.secondary">
                            Apply Tax
                          </Typography>
                        }
                      />
                      {taxConfig.applyTax && (
                        <TextField
                          size="small"
                          type="number"
                          value={taxConfig.taxPercent}
                          onChange={(e) =>
                            setTaxConfig({
                              ...taxConfig,
                              taxPercent: Number(e.target.value),
                            })
                          }
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          }}
                          sx={{
                            width: 80,
                            "& .MuiInputBase-input": {
                              py: 0.5,
                              fontSize: "0.875rem",
                            },
                          }}
                        />
                      )}
                    </div>

                    <div className="flex justify-between items-center text-sm ml-1">
                      <Typography
                        component="span"
                        sx={{ color: "text.secondary" }}
                      >
                        Tax{" "}
                        {taxConfig.applyTax ? `(${taxConfig.taxPercent}%)` : ""}
                      </Typography>
                      <Typography component="span" sx={{ fontWeight: 600 }}>
                        {taxAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </div>
                  </div>
                </Box>

                {openingBalance !== 0 && (
                  <Box
                    className="p-4 rounded-lg border mb-4"
                    sx={{
                      backgroundColor: "rgba(99, 102, 241, 0.05)",
                      borderColor: "rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          color: "primary.main",
                          textTransform: "uppercase",
                        }}
                      >
                        Opening Balance
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color:
                            openingBalance < 0 ? "error.main" : "success.main",
                          fontWeight: 800,
                        }}
                      >
                        {openingBalance < 0 ? "-" : "+"}
                        {Math.abs(openingBalance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </div>
                    {breakthroughData && breakthroughData.length > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => setIsBreakthroughOpen(true)}
                        sx={{
                          mb: 1,
                          fontSize: "0.75rem",
                          py: 0.5,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        View Breakthrough Invoices ({breakthroughData.length})
                      </Button>
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={includeOpeningBalance}
                          onChange={(e) =>
                            setIncludeOpeningBalance(e.target.checked)
                          }
                          sx={{ p: 0.5 }}
                        />
                      }
                      label={
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          Include in Final Total
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                )}

                <Box
                  className="p-4 rounded-lg border"
                  sx={{
                    backgroundColor: "rgba(243, 116, 64, 0.1)",
                    borderColor: "rgba(243, 116, 64, 0.2)",
                  }}
                >
                  <div className="flex justify-between items-end mb-1">
                    <Typography
                      component="span"
                      sx={{
                        color: "primary.main",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                      }}
                    >
                      Grand Total
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        color: "primary.main",
                        fontWeight: 800,
                        fontSize: "1.5rem",
                      }}
                    >
                      {totalPayable.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </div>

                  {/* Calculation Breakdown */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      borderTop: "1px dashed rgba(243, 116, 64, 0.3)",
                      pt: 1,
                      mt: 0.5,
                    }}
                  >
                    {totalSelectedAmount.toLocaleString()} (Net)
                    {taxConfig.applyTax
                      ? ` + ${taxAmount.toLocaleString()} (Tax)`
                      : ""}
                    {includeOpeningBalance
                      ? ` ${openingBalance < 0 ? "-" : "+"} ${Math.abs(openingBalance).toLocaleString()} (Bal)`
                      : ""}
                  </Typography>
                </Box>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <LoadingButton
                  onClick={handleSubmit}
                  fullWidth
                  variant="contained"
                  size="large"
                  loading={isSubmitting}
                  sx={{
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 700,
                    boxShadow: 4,
                  }}
                >
                  Submit Requisition
                </LoadingButton>
                <Button
                  onClick={onClose}
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  sx={{ borderColor: "divider", color: "text.secondary" }}
                >
                  Cancel
                </Button>
              </div>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* --- Invoice Breakthrough Details Dialog --- */}
      <Dialog
        open={isBreakthroughOpen}
        onClose={() => setIsBreakthroughOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "8px",
            bgcolor: "background.paper",
            p: 1,
          }
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            Opening Balance Invoice Breakthrough
          </Typography>
          <IconButton onClick={() => setIsBreakthroughOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 2 }}>
          {isBreakthroughLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : breakthroughData && breakthroughData.length > 0 ? (
            <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: "6px", maxHeight: "60vh", overflowY: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 800 }}>Invoice No.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Invoice Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>PO Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Vendor Site</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Invoice Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Amount Paid</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breakthroughData.map((inv: any, idx: number) => (
                    <TableRow key={idx} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{inv.INVOICE_NUM || "N/A"}</TableCell>
                      <TableCell>{inv.INVOICE_DATE ? dayjs(inv.INVOICE_DATE).format("DD/MM/YYYY") : "N/A"}</TableCell>
                      <TableCell>{inv.PO_NUMBER || "N/A"}</TableCell>
                      <TableCell>{inv.VendorSite || "N/A"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: inv.InvoiceAmount < 0 ? "error.main" : "text.primary" }}>
                        ₹{parseFloat(inv.InvoiceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        ₹{parseFloat(inv.AmountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No breakthrough invoices found for this vendor.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateRequisitionModal;
