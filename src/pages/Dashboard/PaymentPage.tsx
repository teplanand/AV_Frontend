import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Card,
  Avatar,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Pagination,
  Button,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Tabs,
  Tab,
} from "@mui/material";
import {
  GridColDef,
  GridRenderCellParams,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";

import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import { useToast } from "../../hooks/useToast";
import { requisitionsData, budgetaryData } from "../../services/mockData";
import { useSearchParams } from "react-router";
import CreateRequisitionModal from "./CreateRequisitionModal";
import BudgetaryPaymentModal from "./BudgetaryPaymentModal";
import { formatSmartDate } from "../../utils/FormatDate";
import { useListBudgetaryPaymentsQuery } from "../../redux/api/budgetary_payments";
import {
  useListRequisitionsQuery,
  useRequisitionActionMutation,
  useGetRequisitionHistoryQuery,
  useGetRequisitionStatsQuery,
  useGetRequisitionDetailsQuery,
  useListRequisitionAttachmentsQuery,
} from "../../redux/api/requisitions";
import {
  useGetUsersQuery,
  useGetTransactionsMutation,
} from "../../redux/api/workflow";
import { useListBudgetaryStatsQuery } from "../../redux/api/budgetary_payments";
import {
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";

interface DashboardProps {
  type: "supplier" | "internal";
}

const PaymentPage: React.FC<DashboardProps> = ({ type }) => {
  const { showToast } = useToast();

  // View Mode State
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Details Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<
    number | null
  >(null);
  const [detailTab, setDetailTab] = useState(0);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectInstanceId, setRejectInstanceId] = useState<number | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  const { data: supplierStats, refetch: refetchSupplierStats } =
    useGetRequisitionStatsQuery(undefined, { skip: type === "internal" });
  const { data: budgetaryStats, refetch: refetchBudgetaryStats } =
    useListBudgetaryStatsQuery(undefined, { skip: type === "supplier" });

  const refetchStats = () => {
    if (type === "supplier") refetchSupplierStats();
    else refetchBudgetaryStats();
  };

  const handleReload = () => {
    if (type === "supplier") {
      refetchRequisitions();
      refetchSupplierStats();
    } else {
      refetchBudgetary();
      refetchBudgetaryStats();
    }
    showToast("All data refreshed successfully", "success");
  };
  const getCheckDetails = (id: string) => [
    {
      name: `Industrial Valve - ${id}`,
      poQty: 100,
      reqQty: 50,
      pendingQty: 50,
      price: 1200,
      total: 60000,
    },
    {
      name: "Safety Gasket",
      poQty: 200,
      reqQty: 100,
      pendingQty: 100,
      price: 500,
      total: 50000,
    },
  ];

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: "table" | "card" | null,
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  // Grid state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 15,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "date", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });

  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "requested";
  const [activeTab, setActiveTab] = useState(initialStatus);

  // RTK Query for Budgetary Payments
  const {
    data: budgetaryApiResponse,
    isLoading: isBudgetaryLoading,
    refetch: refetchBudgetary,
  } = useListBudgetaryPaymentsQuery(
    {
      skip: paginationModel.page * paginationModel.pageSize,
      limit: paginationModel.pageSize,
      search: filterModel.quickFilterValues?.[0] || "",
    },
    { skip: type !== "internal" },
  );

  // RTK Query for Supplier Requisitions
  const {
    data: requisitionsApiResponse,
    isLoading: isRequisitionsLoading,
    refetch: refetchRequisitions,
  } = useListRequisitionsQuery(
    {
      skip: paginationModel.page * paginationModel.pageSize,
      limit: paginationModel.pageSize,
      search: filterModel.quickFilterValues?.[0] || "",
    },
    { skip: type !== "supplier" },
  );

  const rows = useMemo(() => {
    if (type === "internal" && budgetaryApiResponse) {
      return budgetaryApiResponse.data.data.map((item: any) => {
        let displayStatus = item.payment_status || "Pending";
        const rawStatus = String(item.payment_status || "").toLowerCase();

        if (rawStatus === "a" || rawStatus === "approved")
          displayStatus = "Approved";
        else if (rawStatus === "r" || rawStatus === "rejected")
          displayStatus = "Rejected";
        else if (rawStatus === "p" || rawStatus === "pending")
          displayStatus = "Pending";

        return {
          ...item,
          id: item.id,
          status: displayStatus,
          date: item.date || item.created_date,
          supplierName: item.name_of_payee,
        };
      });
    }
    if (type === "supplier" && requisitionsApiResponse) {
      return requisitionsApiResponse.data.data.map((item: any) => {
        // Map backend status codes to display statuses
        let displayStatus = item.payment_status || "Pending";
        const rawStatus = String(item.payment_status || "").toLowerCase();

        if (rawStatus === "a" || rawStatus === "approved")
          displayStatus = "Approved";
        else if (rawStatus === "r" || rawStatus === "rejected")
          displayStatus = "Rejected";
        else if (rawStatus === "p" || rawStatus === "pending")
          displayStatus = "Pending";
        else if (
          rawStatus === "cr" ||
          rawStatus === "requested" ||
          rawStatus === "cre"
        )
          displayStatus = "Requested";

        return {
          ...item,
          id: item.id,
          status: displayStatus,
          date: item.req_date || item.created_date,
          supplierName: item.supplier_name || "N/A",
          requestRef: item.req_ref_code,
          poNo: item.po_number_display || "N/A",
          poAmount: parseFloat(item.req_amount) || 0,
          gst: parseFloat(item.gst) || 0,
          amount: parseFloat(item.amount) || parseFloat(item.req_amount) || 0,
          advanceAmount: parseFloat(item.req_amount) || 0,
          wf_inst_id: item.wf_inst_id,
          req_amount: item.req_amount,
          req_qty: item.req_qty,
          req_date: item.req_date,
          supplier_site: item.supplier_site,
          payment_status: item.payment_status,
          division: item.division || "N/A",
          product: item.product || "N/A",
          reject_remark: item.reject_remark,
        };
      });
    }
    return [];
  }, [type, budgetaryApiResponse, requisitionsApiResponse]);

  // Dynamically calculate counts based on rows
  const statusCounts = useMemo(() => {
    const stats =
      type === "supplier" ? supplierStats?.data : budgetaryStats?.data;
    if (stats) {
      return {
        requested: stats.requested || stats.cr || 0,
        pending: stats.pending || 0,
        approved: stats.approved || 0,
        rejected: stats.rejected || 0,
      };
    }
    return {
      requested: rows.filter((r) => r.status.toLowerCase() === "requested")
        .length,
      pending: rows.filter((r) => r.status.toLowerCase() === "pending").length,
      approved: rows.filter((r) => r.status.toLowerCase() === "approved")
        .length,
      rejected: rows.filter((r) => r.status.toLowerCase() === "rejected")
        .length,
    };
  }, [rows, type, supplierStats, budgetaryStats]);

  const cards = [
    {
      key: "requested",
      label: "Requested",
      color: "#6366F1", // Indigo for Requested
      count: statusCounts.requested,
    },
    {
      key: "pending",
      label: "Pending",
      color: "#F59E0B",
      count: statusCounts.pending,
    },
    {
      key: "approved",
      label: "Approved",
      color: "#10B981",
      count: statusCounts.approved,
    },
    {
      key: "rejected",
      label: "Rejected",
      color: "#EF4444",
      count: statusCounts.rejected,
    },
  ];

  const finalFilteredRows = useMemo(() => {
    // Filter by active tab status (case-insensitive)
    let data = rows.filter(
      (r) => r.status.toLowerCase() === activeTab.toLowerCase(),
    );

    // Search is handled by API for budgetary, but for supplier we still need it
    if (
      type === "supplier" &&
      filterModel.quickFilterValues &&
      filterModel.quickFilterValues.length > 0
    ) {
      const search = filterModel.quickFilterValues[0].toLowerCase();
      data = data.filter(
        (r) =>
          r.supplierName.toLowerCase().includes(search) ||
          r.requestRef.toLowerCase().includes(search) ||
          r.poNo.includes(search),
      );
    }

    return data;
  }, [rows, activeTab, filterModel, type]);

  const displayedRows = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return finalFilteredRows.slice(start, end);
  }, [finalFilteredRows, paginationModel]);

  const totalCount =
    type === "internal"
      ? budgetaryApiResponse?.data?.total || 0
      : requisitionsApiResponse?.data?.total || 0;
  const isLoading =
    type === "internal" ? isBudgetaryLoading : isRequisitionsLoading;

  const handleOpenForm = React.useCallback(
    (id?: string) => {
      if (id) {
        showToast(`Edit functionality mock for ID: ${id}`, "info");
      } else {
        setIsCreateModalOpen(true);
      }
    },
    [showToast],
  );

  const handleCloseModal = React.useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleFormSubmit = React.useCallback(
    (data: any) => {
      console.log("Submitted Data:", data);
      showToast("Requisition Created Successfully!", "success");
      setIsCreateModalOpen(false);
    },
    [showToast],
  );

  const [processAction, { isLoading: isProcessing }] =
    useRequisitionActionMutation();
  const { data: detailsApiResponse, isFetching: isDetailsLoading } =
    useGetRequisitionDetailsQuery(selectedRequisitionId as number, {
      skip: !selectedRequisitionId,
    });
  const { data: attachmentsResponse, isFetching: isAttachmentsLoading } =
    useListRequisitionAttachmentsQuery(selectedRequisitionId as number, {
      skip: !selectedRequisitionId,
    });

  const handleViewAttachment = (id: number) => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
    const token = localStorage.getItem("authToken");
    window.open(`${baseUrl}/requisitions/attachments/view/${id}?token=${token}`, "_blank");
  };

  const [
    getTransactions,
    { data: transactionsData, isLoading: isHistoryLoading },
  ] = useGetTransactionsMutation();

  const detailsRows = detailsApiResponse?.data || [];
  const historyData = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData as any)?.data || [];

  const handleViewDetails = React.useCallback(
    async (id: number) => {
      setSelectedRequisitionId(id);
      setIsDetailModalOpen(true);
      setDetailTab(0);

      // Use 'rows' which already has the combined/mapped data
      const record = rows.find((r) => r.id === id);

      if (record?.wf_inst_id) {
        getTransactions({ WF_INSTANCE_ID: String(record.wf_inst_id) });
      }
    },
    [rows, getTransactions],
  );

  const handleCloseDetailModal = React.useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedRequisitionId(null);
  }, []);

  const getStatusLabelAndColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CR":
        return {
          label: "Requested / Created",
          color: "primary",
          icon: <EventAvailableIcon sx={{ fontSize: 16 }} />,
        };
      case "A":
        return {
          label: "Approved",
          color: "success",
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
        };
      case "P":
        return {
          label: "Pending",
          color: "warning",
          icon: <HistoryIcon sx={{ fontSize: 16 }} />,
        };
      case "C":
        return {
          label: "Completed",
          color: "info",
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
        };
      case "R":
        return {
          label: "Rejected",
          color: "error",
          icon: <CancelIcon sx={{ fontSize: 16 }} />,
        };
      default:
        return {
          label: status || "Unknown",
          color: "default",
          icon: <HistoryIcon sx={{ fontSize: 16 }} />,
        };
    }
  };

  const handleAccept = React.useCallback(
    (wf_inst_id?: number) => async () => {
      if (!wf_inst_id) {
        showToast("Workflow instance not found for this record", "error");
        return;
      }
      try {
        await processAction({ wf_inst_id, status: "A" }).unwrap();
        showToast(`Requisition approved successfully`, "success");
        if (type === "supplier") {
          refetchRequisitions();
        } else {
          refetchBudgetary();
        }
        refetchStats();
      } catch (err: any) {
        showToast(
          err?.data?.message || "Failed to approve requisition",
          "error",
        );
      }
    },
    [
      showToast,
      processAction,
      refetchRequisitions,
      refetchBudgetary,
      refetchStats,
      type,
    ],
  );

  const handleReject = React.useCallback(
    (wf_inst_id?: number) => () => {
      if (!wf_inst_id) {
        showToast("Workflow instance not found for this record", "error");
        return;
      }
      setRejectInstanceId(wf_inst_id);
      setRejectRemark("");
      setRejectModalOpen(true);
    },
    [showToast],
  );

  const confirmReject = React.useCallback(async () => {
    if (!rejectInstanceId) return;
    if (!rejectRemark.trim()) {
      showToast("Please provide a remark for rejection", "error");
      return;
    }
    try {
      await processAction({ wf_inst_id: rejectInstanceId, status: "R", remark: rejectRemark } as any).unwrap();
      showToast(`Requisition rejected successfully`, "success");
      setRejectModalOpen(false);
      if (type === "supplier") {
        refetchRequisitions();
      } else {
        refetchBudgetary();
      }
      refetchStats();
    } catch (err: any) {
      showToast(
        err?.data?.message || "Failed to reject requisition",
        "error",
      );
    }
  }, [rejectInstanceId, rejectRemark, processAction, refetchRequisitions, refetchBudgetary, refetchStats, showToast, type]);

  const columns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "date",
        headerName: "Date",
        flex: 0.8,
        minWidth: 100,
        // valueFormatter: (params: any) => formatSmartDate(params.value),
        renderCell: (params: any) => formatSmartDate(params.value),
      },
      {
        field: "supplierName",
        headerName: type === "supplier" ? "Supplier Name" : "Name of Payee",
        flex: 1.5,
        minWidth: 180,
      },
    ];

    if (type === "supplier") {
      baseColumns.push(
        {
          field: "requestRef",
          headerName: "Request Ref",
          flex: 1.2,
          minWidth: 150,
        },
        {
          field: "poNo",
          headerName: "PO Number",
          flex: 1,
          minWidth: 120,
        },
        {
          field: "PAYMENT_TERMS",
          headerName: "Payment Terms",
          flex: 1.2,
          minWidth: 160,
          renderCell: (params: any) =>
            params.row.poNo !== "N/A" ? params.value || "N/A" : "-",
        },
        {
          field: "poAmount",
          headerName: "PO Amount",
          type: "number",
          flex: 1,
          minWidth: 120,
          renderCell: (params: any) => `₹${params.value?.toLocaleString()}`,
        },
        {
          field: "gst",
          headerName: "GST",
          type: "number",
          flex: 1,
          minWidth: 100,
          renderCell: (params: any) => `₹${params.value?.toLocaleString()}`,
        },
        {
          field: "amount",
          headerName: "Amount",
          type: "number",
          flex: 1,
          minWidth: 120,
          renderCell: (params: any) => `₹${params.value?.toLocaleString()}`,
        },

      );
    } else {
      baseColumns.push(
        {
          field: "cjo_no",
          headerName: "CJO No.",
          flex: 1,
          minWidth: 120,
        },
        {
          field: "po_wo_no",
          headerName: "PO/WO No.",
          flex: 1,
          minWidth: 120,
        },
        {
          field: "amount",
          headerName: "Amount",
          type: "number",
          flex: 1,
          minWidth: 120,
          renderCell: (params: any) => `₹${params.value?.toLocaleString()}`,
        },
        {
          field: "mode_of_payment",
          headerName: "Mode",
          flex: 0.8,
          minWidth: 100,
        },
      );
    }

    return [
      ...baseColumns,
      {
        field: "status",
        headerName: "Status",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams) => {
          let bgcolor = "#eee";
          let textcolor = "#333";

          switch (params.value) {
            case "Approved":
              bgcolor = "#DEF7EC";
              textcolor = "#03543F";
              break;
            case "Rejected":
              bgcolor = "#FDE8E8";
              textcolor = "#9B1C1C";
              break;
            case "Pending":
              bgcolor = "#FEF3C7";
              textcolor = "#92400E";
              break;
            default:
              bgcolor = "#E1EFFE";
              textcolor = "#1E429F";
          }

          return (
            <Chip
              label={params.value as string}
              size="small"
              sx={{
                backgroundColor: bgcolor,
                color: textcolor,
                fontWeight: 600,
              }}
            />
          );
        },
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Action",
        width: 150,
        getActions: (params: any) => {
          const actions = [
            <GridActionsCellItem
              key="view"
              icon={<VisibilityIcon color="info" />}
              label="View Details"
              onClick={() => handleViewDetails(params.id as number)}
              showInMenu={false}
            />,
          ];

          if (params.row.status === "Pending" && params.row.user_can_act) {
            actions.push(
              <GridActionsCellItem
                key="accept"
                icon={<CheckCircleIcon color="success" />}
                label="Accept"
                onClick={handleAccept(params.row.wf_inst_id as number)}
                showInMenu={false}
              />,
              <GridActionsCellItem
                key="reject"
                icon={<CancelIcon color="error" />}
                label="Reject"
                onClick={handleReject(params.row.wf_inst_id as number)}
                showInMenu={false}
              />,
            );
          }
          return actions;
        },
      },
    ];
  }, [handleAccept, handleReject, type, handleViewDetails]);

  const renderCards = (data: any[]) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
      {data.map((row) => (
        <Box key={row.id}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "all 0.2s ease-in-out",
              border: 1,
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 24px -10px rgba(0,0,0,0.1)",
                borderColor: "#cbd5e1",
              },
              position: "relative",
            }}
          >
            {/* Status Strip */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor:
                  row.status === "Approved"
                    ? "#22c55e"
                    : row.status === "Rejected"
                      ? "#ef4444"
                      : "#f59e0b",
              }}
            />

            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, pl: 2.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Chip
                  label={row.status}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    bgcolor:
                      row.status === "Approved"
                        ? "#dcfce7"
                        : row.status === "Rejected"
                          ? "#fee2e2"
                          : "#fef3c7",
                    color:
                      row.status === "Approved"
                        ? "#166534"
                        : row.status === "Rejected"
                          ? "#991b1b"
                          : "#92400e",
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  {new Date(row.date).toLocaleDateString()}
                </Typography>
              </Box>

              <Typography
                variant="subtitle1"
                fontWeight={700}
                gutterBottom
                noWrap
                title={row.supplierName}
                sx={{ fontSize: "0.95rem", mb: 1 }}
              >
                {row.supplierName}
              </Typography>

              <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="#64748b">
                    {type === "supplier" ? "PO Number" : "CJO No."}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {type === "supplier" ? row.poNo : row.cjo_no}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="#64748b">
                    {type === "supplier" ? "Total PO Value" : "Amount"}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    ₹
                    {(type === "supplier"
                      ? row.poAmount
                      : row.amount
                    )?.toLocaleString()}
                  </Typography>
                </Box>
                {type === "supplier" && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="#64748b">
                      Advance Reqd
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#F37440"
                    >
                      ₹{row.advanceAmount.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    fontStyle: "italic",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {row.particulars_of_payment}
                </Typography>
              </Stack>
            </CardContent>

            <Box
              sx={{
                p: 1,
                pl: 2.5,
                bgcolor: "action.hover",
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={() => handleViewDetails(row.id)}
                >
                  <VisibilityIcon fontSize="small" sx={{ color: "#64748b" }} />
                </IconButton>
              </Tooltip>
              {row.status === "Pending" && row.user_can_act && (
                <>
                  <Tooltip title="Reject">
                    <IconButton
                      size="small"
                      onClick={handleReject(row.wf_inst_id)}
                    >
                      <CancelIcon fontSize="small" sx={{ color: "#ef4444" }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Approve">
                    <IconButton
                      size="small"
                      onClick={handleAccept(row.wf_inst_id)}
                    >
                      <CheckCircleIcon
                        fontSize="small"
                        sx={{ color: "#22c55e" }}
                      />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
                </Card>
              </Box>
            ))}
            {data.length === 0 && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Card
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderStyle: "dashed",
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <Typography color="textSecondary">
                    No requisitions match your search.
                  </Typography>
                </Card>
              </Box>
            )}
          </Box>
        );

  return (
    <Box>
      {/* 4 Status Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {cards.map((tab) => (
          <Box key={tab.key} onClick={() => setActiveTab(tab.key)}>
            <Card
              sx={{
                height: "100%",
                cursor: "pointer",
                background: (theme) =>
                  activeTab.toLowerCase() === tab.key
                    ? theme.palette.mode === "dark"
                      ? theme.palette.action.selected
                      : "#fff"
                    : theme.palette.mode === "dark"
                      ? theme.palette.background.paper
                      : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                border: 1,
                borderColor:
                  activeTab.toLowerCase() === tab.key ? tab.color : "divider",
                boxShadow:
                  activeTab.toLowerCase() === tab.key
                    ? `0 4px 12px -2px ${tab.color}40`
                    : "none",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: tab.color,
                  boxShadow: `0 4px 12px -2px ${tab.color}20`,
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  {tab.label}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    color: tab.color,
                    fontFamily: "Nunito",
                  }}
                >
                  {tab.count}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <ReusableDataGrid
        rows={finalFilteredRows}
        columns={columns}
        loading={isLoading}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        totalCount={totalCount}
        refetch={handleReload}
        title={type === "supplier" ? "Supplier Payment" : "Payment Voucher"}
        viewMode={viewMode}
        cardRenderer={renderCards}
        height="calc(100vh - 185px)"
        addButtonLabel=" "
        onAdd={() => handleOpenForm()}
        headerControls={
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            aria-label="view mode"
            size="small"
            sx={{ height: 32 }}
          >
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card" aria-label="card view">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        }
        permissions={{
          create: true,
          edit: false,
          delete: false,
          download: true,
          view: true,
        }}
        uniqueIdField="id"
      />

      {/* Modal Selection */}
      {type === "supplier" ? (
        <CreateRequisitionModal
          open={isCreateModalOpen}
          onClose={handleCloseModal}
        />
      ) : (
        <BudgetaryPaymentModal
          open={isCreateModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Reject Remark Modal */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Requisition</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this requisition. This remark will be permanently recorded.
          </Typography>
          <TextField
            autoFocus
            required
            margin="dense"
            label="Rejection Remark"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectModalOpen(false)} color="inherit" variant="text">
            Cancel
          </Button>
          <Button onClick={confirmReject} color="error" variant="contained" disabled={!rejectRemark.trim()}>
            Reject Requisition
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
      {/* View Details Modal */}
      <Dialog
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Requisition Details
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton onClick={handleCloseDetailModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
          {type === "supplier" && selectedRequisitionId && (
            <Box
              sx={{
                p: 2,
                px: 3,
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Supplier
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {
                      rows.find((r) => r.id === selectedRequisitionId)
                        ?.supplierName
                    }
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    PO Number
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {rows.find((r) => r.id === selectedRequisitionId)?.poNo}
                  </Typography>
                </Box>
                {rows.find((r) => r.id === selectedRequisitionId)?.poNo !==
                  "N/A" && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Payment Terms
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {rows.find((r) => r.id === selectedRequisitionId)
                        ?.PAYMENT_TERMS || "N/A"}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Division
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {rows.find((r) => r.id === selectedRequisitionId)?.division || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Product
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {rows.find((r) => r.id === selectedRequisitionId)?.product || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600, textTransform: "uppercase" }}>
                    PO Amount
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    ₹{rows.find((r) => r.id === selectedRequisitionId)?.poAmount?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600, textTransform: "uppercase" }}>
                    GST
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    ₹{rows.find((r) => r.id === selectedRequisitionId)?.gst?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600, textTransform: "uppercase" }}>
                    Total Amount
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    ₹{rows.find((r) => r.id === selectedRequisitionId)?.amount?.toLocaleString() || rows.find((r) => r.id === selectedRequisitionId)?.req_amount?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Box>
              {rows.find((r) => r.id === selectedRequisitionId)?.reject_remark && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 2, border: 1, borderColor: 'error.main' }}>
                  <Typography variant="caption" color="error.dark" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    Rejection Reason
                  </Typography>
                  <Typography variant="body2" color="error.dark" fontWeight={600}>
                    {rows.find((r) => r.id === selectedRequisitionId)?.reject_remark}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Tabs
              value={detailTab}
              onChange={(_, val) => setDetailTab(val)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab
                label="Requisition Items"
                icon={<ReceiptLongIcon fontSize="small" />}
                iconPosition="start"
                sx={{ fontWeight: 600, minHeight: 48 }}
              />
              <Tab
                label="Workflow History"
                icon={<HistoryIcon fontSize="small" />}
                iconPosition="start"
                sx={{ fontWeight: 600, minHeight: 48 }}
              />
              <Tab
                label="Attachments"
                icon={<AttachFileIcon fontSize="small" />}
                iconPosition="start"
                sx={{ fontWeight: 600, minHeight: 48 }}
              />
            </Tabs>
          </Box>

          {selectedRequisitionId && (
            <Box sx={{ p: 3 }}>
              {detailTab === 0 ? (
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    Items Summary
                  </Typography>
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "background.paper",
                    }}
                  >
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "action.hover" }}>
                          <TableRow
                            sx={{
                              "& th": {
                                fontWeight: 700,
                                color: "text.primary",
                                py: 1.5,
                              },
                            }}
                          >
                            <TableCell>Product Name</TableCell>
                            <TableCell align="right">PO Qty</TableCell>
                            <TableCell align="right">Request Qty</TableCell>
                            <TableCell align="right">Pending Qty</TableCell>
                            <TableCell align="right">PO Price</TableCell>
                            <TableCell align="right">Total Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {isDetailsLoading ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                align="center"
                                sx={{ py: 6 }}
                              >
                                <CircularProgress size={32} />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 1 }}
                                >
                                  Loading items...
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : detailsRows.length > 0 ? (
                            detailsRows.map((detailRow: any, index: number) => (
                              <TableRow
                                key={index}
                                sx={{
                                  "&:last-child td, &:last-child th": {
                                    border: 0,
                                  },
                                  "&:hover": { bgcolor: "action.hover" },
                                }}
                              >
                                <TableCell
                                  component="th"
                                  scope="row"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {detailRow.name}
                                </TableCell>
                                <TableCell align="right">
                                  {detailRow.poQty}
                                </TableCell>
                                <TableCell align="right">
                                  {detailRow.reqQty}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography
                                    variant="body2"
                                    color={
                                      detailRow.pendingQty > 0
                                        ? "warning.main"
                                        : "text.secondary"
                                    }
                                  >
                                    {detailRow.pendingQty}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  ₹{detailRow.price.toLocaleString()}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 600 }}
                                >
                                  ₹{detailRow.total.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                align="center"
                                sx={{ py: 4 }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No items found for this requisition.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              ) : detailTab === 1 ? (
                <Box sx={{ minHeight: 300 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Approval Journey
                  </Typography>

                  {isHistoryLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        py: 8,
                      }}
                    >
                      <CircularProgress size={32} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Fetching workflow history...
                      </Typography>
                    </Box>
                  ) : historyData.length > 0 ? (
                    <Box
                      sx={{
                        position: "relative",
                        pl: 4,
                        ml: 1,
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: "2px",
                          bgcolor: "divider",
                        },
                      }}
                    >
                      {historyData.map((step: any, index: number) => (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            mb: 4,
                            "&:last-child": { mb: 0 },
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              left: -32,
                              top: 4,
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              bgcolor: `${getStatusLabelAndColor(step.status).color}.main`,
                              border: "3px solid",
                              borderColor: "background.paper",
                              boxShadow: "0 0 0 2px rgba(0,0,0,0.05)",
                              zIndex: 1,
                            }}
                          />
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              transition: "transform 0.2s",
                              backdropFilter: "blur(8px)",
                              backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.01)",
                              borderLeft: "4px solid",
                              borderLeftColor: `${getStatusLabelAndColor(step.status).color}.main`,
                              "&:hover": {
                                transform: "translateX(4px)",
                                borderColor: `${getStatusLabelAndColor(step.status).color}.light`,
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {getStatusLabelAndColor(step.status).icon}
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={800}
                                  sx={{
                                    color: `${getStatusLabelAndColor(step.status).color}.main`,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {getStatusLabelAndColor(step.status).label}
                                </Typography>
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                }}
                              >
                                {formatSmartDate(step.transaction_datetime)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor: "primary.main",
                                  fontSize: 12,
                                }}
                              >
                                {step.stk_name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  color="text.primary"
                                >
                                  {step.stk_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", lineHeight: 1 }}
                                >
                                  ID: {step.stk_id}
                                </Typography>
                              </Box>
                            </Box>

                            {step.remarks && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 1.5,
                                  p: 1.5,
                                  bgcolor: "action.hover",
                                  borderRadius: 1.5,
                                  fontSize: "0.8125rem",
                                  fontStyle: "italic",
                                  border: "1px dashed divider",
                                }}
                              >
                                "{step.remarks}"
                              </Typography>
                            )}
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        py: 6,
                        bgcolor: "action.hover",
                        borderRadius: 2,
                      }}
                    >
                      <HistoryIcon
                        sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No workflow history available for this record.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ minHeight: 300 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Attachments
                  </Typography>
                  {isAttachmentsLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Fetching attachments...
                      </Typography>
                    </Box>
                  ) : attachmentsResponse?.data?.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                      {attachmentsResponse.data.map((attachment: any, index: number) => (
                        <Paper
                          key={index}
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            width: 140,
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            transition: "transform 0.2s",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              borderColor: "primary.main",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          <AttachFileIcon sx={{ fontSize: 32, color: "primary.main" }} />
                          <Typography
                            variant="caption"
                            sx={{
                              textAlign: "center",
                              width: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                            }}
                            title={attachment.file_name}
                          >
                            {attachment.file_name}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleViewAttachment(attachment.id)}
                            sx={{ mt: 1, minWidth: 0, px: 2 }}
                          >
                            View
                          </Button>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, bgcolor: "action.hover", borderRadius: 2 }}>
                      <AttachFileIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No attachments available for this record.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {!selectedRequisitionId && (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              No details available
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentPage;
