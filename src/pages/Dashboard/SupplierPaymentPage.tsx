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
  CircularProgress,
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
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DownloadIcon from "@mui/icons-material/Download";


import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import { useToast } from "../../hooks/useToast";
import { useSearchParams } from "react-router";
import CreateRequisitionModal from "./CreateRequisitionModal";
import { formatSmartDate } from "../../utils/FormatDate";
import {
  useListRequisitionsQuery,
  useRequisitionActionMutation,
  useGetRequisitionHistoryQuery,
  useGetRequisitionStatsQuery,
  useGetRequisitionDetailsQuery,
  useListRequisitionAttachmentsQuery,
} from "../../redux/api/requisitions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useGetTransactionsMutation } from "../../redux/api/workflow";

const SupplierPaymentPage: React.FC = () => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectInstanceId, setRejectInstanceId] = useState<number | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  const { data: supplierStats, refetch: refetchSupplierStats } = useGetRequisitionStatsQuery(undefined);

  const handleReload = () => {
    refetchRequisitions();
    refetchSupplierStats();
    showToast("All data refreshed successfully", "success");
  };

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: "table" | "card" | null,
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

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

  const {
    data: requisitionsApiResponse,
    isLoading: isRequisitionsLoading,
    refetch: refetchRequisitions
  } = useListRequisitionsQuery({
    skip: paginationModel.page * paginationModel.pageSize,
    limit: paginationModel.pageSize,
    search: filterModel.quickFilterValues?.[0] || "",
    status: activeTab,
  });

  const rows = useMemo(() => {
    if (requisitionsApiResponse) {
      return requisitionsApiResponse.data.data.map((item: any) => {
        let displayStatus = item.payment_status || "Pending";
        const rawStatus = String(item.payment_status || "").toLowerCase();

        if (rawStatus === "a" || rawStatus === "approved") displayStatus = "Approved";
        else if (rawStatus === "r" || rawStatus === "rejected") displayStatus = "Rejected";
        else if (rawStatus === "p" || rawStatus === "pending") displayStatus = "Pending";
        else if (rawStatus === "cr" || rawStatus === "requested" || rawStatus === "cre") displayStatus = "Requested";

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
  }, [requisitionsApiResponse]);

  const statusCounts = useMemo(() => {
    const stats = supplierStats?.data;
    if (stats) {
      return {
        requested: stats.requested || stats.cr || 0,
        pending: stats.pending || 0,
        approved: stats.approved || 0,
        rejected: stats.rejected || 0,
      };
    }
    return {
      requested: rows.filter((r) => r.status.toLowerCase() === "requested").length,
      pending: rows.filter((r) => r.status.toLowerCase() === "pending").length,
      approved: rows.filter((r) => r.status.toLowerCase() === "approved").length,
      rejected: rows.filter((r) => r.status.toLowerCase() === "rejected").length,
    };
  }, [rows, supplierStats]);

  const cards = [
    { key: "requested", label: "Requested", color: "#6366F1", count: statusCounts.requested },
    { key: "pending", label: "Pending", color: "#F59E0B", count: statusCounts.pending },
    { key: "approved", label: "Approved", color: "#10B981", count: statusCounts.approved },
    { key: "rejected", label: "Rejected", color: "#EF4444", count: statusCounts.rejected },
  ];

  const finalFilteredRows = useMemo(() => {
    let data = rows;
    if (filterModel.quickFilterValues && filterModel.quickFilterValues.length > 0) {
      const search = filterModel.quickFilterValues[0].toLowerCase();
      data = data.filter(
        (r) =>
          r.supplierName.toLowerCase().includes(search) ||
          r.requestRef.toLowerCase().includes(search) ||
          r.poNo.includes(search),
      );
    }
    return data;
  }, [rows, filterModel]);

  const totalCount = requisitionsApiResponse?.data?.total || 0;

  const handleOpenForm = React.useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const [processAction, { isLoading: isProcessing }] = useRequisitionActionMutation();
  const { data: detailsApiResponse, isFetching: isDetailsLoading } = useGetRequisitionDetailsQuery(selectedRequisitionId as number, { skip: !selectedRequisitionId });
  const { data: attachmentsResponse, isFetching: isAttachmentsLoading } = useListRequisitionAttachmentsQuery(selectedRequisitionId as number, { skip: !selectedRequisitionId });
  const [getTransactions, { data: transactionsData, isLoading: isHistoryLoading }] = useGetTransactionsMutation();

  const handleViewAttachment = (id: number) => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
    const token = localStorage.getItem("authToken");
    window.open(`${baseUrl}/requisitions/attachments/view/${id}?token=${token}`, "_blank");
  };

  const detailsRows = detailsApiResponse?.data || [];
  const historyData = Array.isArray(transactionsData) ? transactionsData : (transactionsData as any)?.data || [];

  const handleDownloadPDF = React.useCallback((id: number) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
    const token = localStorage.getItem("authToken");
    window.open(`${baseUrl}/requisitions/${id}/download-pdf?token=${token}`, "_blank");
  }, []);

  const handleViewDetails = React.useCallback(async (id: number) => {
    setSelectedRequisitionId(id);
    setIsDetailModalOpen(true);
    setDetailTab(0);
    const record = rows.find((r) => r.id === id);
    if (record?.wf_inst_id) {
      getTransactions({ WF_INSTANCE_ID: String(record.wf_inst_id) });
    }
  }, [rows, getTransactions]);

  const handleCloseDetailModal = React.useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedRequisitionId(null);
  }, []);

  const getStatusLabelAndColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CR": return { label: "Requested / Created", color: "primary", icon: <EventAvailableIcon sx={{ fontSize: 16 }} /> };
      case "A": return { label: "Approved", color: "success", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
      case "P": return { label: "Pending", color: "warning", icon: <HistoryIcon sx={{ fontSize: 16 }} /> };
      case "C": return { label: "Completed", color: "info", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
      case "R": return { label: "Rejected", color: "error", icon: <CancelIcon sx={{ fontSize: 16 }} /> };
      default: return { label: status || "Unknown", color: "default", icon: <HistoryIcon sx={{ fontSize: 16 }} /> };
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
        refetchRequisitions();
        refetchSupplierStats();
      } catch (err: any) {
        showToast(err?.data?.message || "Failed to approve requisition", "error");
      }
    },
    [showToast, processAction, refetchRequisitions, refetchSupplierStats],
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
      refetchRequisitions();
      refetchSupplierStats();
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to reject requisition", "error");
    }
  }, [rejectInstanceId, rejectRemark, processAction, refetchRequisitions, refetchSupplierStats, showToast]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "date",
      headerName: "Date",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: any) => formatSmartDate(params.value),
    },
    {
      field: "supplierName",
      headerName: "Supplier Name",
      flex: 1.5,
      minWidth: 180,
    },
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
      renderCell: (params: any) => params.row.poNo !== "N/A" ? (params.row.PAYMENT_TERMS || "N/A") : "-",
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

    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => {
        let bgcolor = "#eee";
        let textcolor = "#333";
        switch (params.value) {
          case "Approved": bgcolor = "#DEF7EC"; textcolor = "#03543F"; break;
          case "Rejected": bgcolor = "#FDE8E8"; textcolor = "#9B1C1C"; break;
          case "Pending": bgcolor = "#FEF3C7"; textcolor = "#92400E"; break;
          case "Requested": bgcolor = "#E1EFFE"; textcolor = "#1E429F"; break;
          default: bgcolor = "#E1EFFE"; textcolor = "#1E429F";
        }
        return (
          <Chip
            label={params.value as string}
            size="small"
            sx={{ backgroundColor: bgcolor, color: textcolor, fontWeight: 600 }}
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
          <GridActionsCellItem
            key="download"
            icon={<DownloadIcon color="primary" />}
            label="Download PDF"
            onClick={() => handleDownloadPDF(params.id as number)}
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
            />
          );
        }
        return actions;
      },
    },
  ], [handleAccept, handleReject, handleViewDetails, handleDownloadPDF]);

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
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: row.status === "Approved" ? "#22c55e" : row.status === "Rejected" ? "#ef4444" : "#f59e0b",
              }}
            />
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, pl: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Chip
                  label={row.status}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    bgcolor: row.status === "Approved" ? "#dcfce7" : row.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                    color: row.status === "Approved" ? "#166534" : row.status === "Rejected" ? "#991b1b" : "#92400e",
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  {new Date(row.date).toLocaleDateString()}
                </Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom noWrap sx={{ fontSize: "0.95rem", mb: 1 }}>
                {row.supplierName}
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="#64748b">PO Number</Typography>
                  <Typography variant="body2" fontWeight={500}>{row.poNo}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="#64748b">Total PO Value</Typography>
                  <Typography variant="body2" fontWeight={500}>₹{row.poAmount.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="#64748b">Advance Reqd</Typography>
                  <Typography variant="body2" fontWeight={700} color="#F37440">₹{row.advanceAmount.toLocaleString()}</Typography>
                </Box>
              </Stack>
            </CardContent>
            <Box sx={{ p: 1, pl: 2.5, bgcolor: "action.hover", borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <IconButton size="small" onClick={() => handleViewDetails(row.id)}>
                <VisibilityIcon fontSize="small" sx={{ color: "#64748b" }} />
              </IconButton>
            </Box>
          </Card>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {cards.map((tab) => (
          <Box key={tab.key} onClick={() => setActiveTab(tab.key)}>
            <Card
              sx={{
                height: "100%",
                cursor: "pointer",
                border: 1,
                borderColor: activeTab.toLowerCase() === tab.key ? tab.color : "divider",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" fontWeight={700}>{tab.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: tab.color }}>{tab.count}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <ReusableDataGrid
        rows={finalFilteredRows}
        columns={columns}
        loading={isRequisitionsLoading}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        totalCount={totalCount}
        refetch={handleReload}
        title="Supplier Payment"
        viewMode={viewMode}
        cardRenderer={renderCards}
        height="calc(100vh - 185px)"
        addButtonLabel=" "
        onAdd={handleOpenForm}
        headerControls={
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
            <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="card"><ViewModuleIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        }
        permissions={{ create: true, edit: false, delete: false, download: true, view: true }}
        uniqueIdField="id"
      />

      <CreateRequisitionModal open={isCreateModalOpen} onClose={handleCloseModal} />

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

      <Dialog open={isDetailModalOpen} onClose={handleCloseDetailModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={700}>Requisition Details</Typography>
          <IconButton onClick={handleCloseDetailModal} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
          {selectedRequisitionId && (
            <Box sx={{ p: 3 }}>
              {(() => {
                const record = rows.find(r => r.id === selectedRequisitionId);
                if (!record) return null;

                const fields = [
                  { label: "Supplier Name", value: record.supplierName, icon: <BusinessIcon color="primary" /> },
                  { label: "Date", value: formatSmartDate(record.date), icon: <EventAvailableIcon color="primary" /> },
                  { label: "Request Reference", value: record.requestRef, icon: <ReceiptLongIcon color="primary" /> },
                  { label: "Supplier Site", value: record.supplier_site, icon: <BusinessIcon color="primary" /> },
                  { label: "PO Number", value: record.poNo, icon: <ReceiptLongIcon color="primary" /> },
                  ...(record.poNo !== "N/A" ? [{ label: "Payment Terms", value: record.PAYMENT_TERMS || "N/A", icon: <ReceiptLongIcon color="primary" /> }] : []),
                  { label: "Division", value: record.division || "N/A", icon: <BusinessIcon color="primary" /> },
                  { label: "Product", value: record.product || "N/A", icon: <ReceiptLongIcon color="primary" /> },
                  { label: "PO Amount", value: `₹${parseFloat(record.poAmount || 0).toLocaleString()}`, icon: <ReceiptLongIcon color="primary" /> },
                  { label: "GST", value: `₹${parseFloat(record.gst || 0).toLocaleString()}`, icon: <ReceiptLongIcon color="primary" /> },
                  { label: "Total Amount", value: `₹${parseFloat(record.amount || record.req_amount || 0).toLocaleString()}`, icon: <CheckCircleIcon color="primary" /> },
                ];

                return (
                  <Stack spacing={4}>
                    {/* General Information */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptLongIcon color="primary" /> General Information
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                        {fields.map((item, idx) => (
                          <Box key={idx}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', height: '100%' }}>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={{ bgcolor: 'primary.light', p: 0.8, borderRadius: 1.5, display: 'flex', opacity: 0.8 }}>
                                  {item.icon}
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', lineHeight: 1 }}>
                                    {item.label}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700}>
                                    {item.value}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          </Box>
                        ))}
                      </Box>
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                          Remarks / Justification
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: record.remarks ? 'normal' : 'italic' }}>
                          {record.remarks || "No remarks provided."}
                        </Typography>
                      </Box>
                      {record.reject_remark && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 2, border: 1, borderColor: 'error.main' }}>
                          <Typography variant="caption" color="error.dark" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                            Rejection Reason
                          </Typography>
                          <Typography variant="body2" color="error.dark" fontWeight={600}>
                            {record.reject_remark}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Requisition Items */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ViewListIcon color="primary" /> Requisition Items
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead sx={{ bgcolor: "action.hover" }}>
                            <TableRow>
                              <TableCell>Product Name</TableCell>
                              <TableCell align="right">Accounting Date</TableCell>
                              <TableCell align="right">PO Qty</TableCell>
                              <TableCell align="right">Req Qty</TableCell>
                              <TableCell align="right">Unit Price</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {isDetailsLoading ? (
                              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                            ) : detailsRows.map((row: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{row.name}</TableCell>
                                <TableCell align="right">{formatSmartDate(row.accounting_date)}</TableCell>
                                <TableCell align="right">{row.poQty}</TableCell>
                                <TableCell align="right">{row.reqQty}</TableCell>
                                <TableCell align="right">₹{row.price.toLocaleString()}</TableCell>
                                <TableCell align="right">₹{row.total.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Workflow History */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" /> Workflow History
                      </Typography>
                      <Box sx={{ mt: 1, pl: 2 }}>
                        {isHistoryLoading ? (
                          <CircularProgress size={24} />
                        ) : historyData.length > 0 ? (
                          historyData.map((step: any, idx: number) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 0, position: 'relative' }}>
                              {idx !== historyData.length - 1 && (
                                <Box sx={{ position: 'absolute', left: 15, top: 30, bottom: -10, width: 2, bgcolor: 'divider', zIndex: 0 }} />
                              )}
                              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: `${getStatusLabelAndColor(step.status).color}.light`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, mt: 0.5, color: `${getStatusLabelAndColor(step.status).color}.main` }}>
                                {getStatusLabelAndColor(step.status).icon}
                              </Box>
                              <Box sx={{ pb: 3, flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Typography variant="subtitle2" fontWeight={800} color="text.primary">{getStatusLabelAndColor(step.status).label}</Typography>
                                  <Typography variant="caption" color="text.secondary">{formatSmartDate(step.transaction_datetime)}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">{step.stk_name} ({step.wf_step_name})</Typography>
                                {step.remarks && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.secondary', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                    "{step.remarks}"
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="textSecondary">No history available.</Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Attachments */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachFileIcon color="primary" /> Attachments
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {isAttachmentsLoading ? (
                          <CircularProgress size={24} />
                        ) : attachmentsResponse?.data?.length > 0 ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
                                  width: 120,
                                  bgcolor: "background.paper",
                                  borderRadius: 2,
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
                          <Typography variant="body2" color="textSecondary">No attachments available.</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                );
              })()}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SupplierPaymentPage;
