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
  Button,
  Stack,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
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
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BusinessIcon from "@mui/icons-material/Business";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";

import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import { useToast } from "../../hooks/useToast";
import { useSearchParams } from "react-router";
import BudgetaryPaymentModal from "./BudgetaryPaymentModal";
import { formatSmartDate } from "../../utils/FormatDate";
import { 
  useListBudgetaryPaymentsQuery,
  useListBudgetaryAttachmentsQuery,
  useListBudgetaryStatsQuery
} from "../../redux/api/budgetary_payments";
import { useRequisitionActionMutation } from "../../redux/api/requisitions";
import { useGetTransactionsMutation } from "../../redux/api/workflow";

const BudgetaryAttachmentList: React.FC<{ paymentId: number }> = ({ paymentId }) => {
  const { data: attachmentsResponse, isLoading } = useListBudgetaryAttachmentsQuery(paymentId);
  const attachments = attachmentsResponse?.data || [];

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={24} />
    </Box>
  );
  
  if (attachments.length === 0) return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="body2" color="textSecondary">No attachments found.</Typography>
    </Box>
  );

  const handleView = (id: number) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
    const token = localStorage.getItem("authToken");
    window.open(`${baseUrl}/budgetary-payments/attachments/view/${id}?token=${token}`, "_blank");
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
      {attachments.map((file: any) => (
        <Box key={file.id}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <Avatar sx={{ bgcolor: file.file_type?.includes('image') ? 'primary.light' : 'error.light' }}>
               {file.file_type?.includes('image') ? 'IMG' : 'PDF'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
              <Tooltip title={file.file_name} arrow>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4,
                    mb: 0.5
                  }}
                >
                  {file.file_name}
                </Typography>
              </Tooltip>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>{file.file_type}</Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => handleView(file.id)} 
              color="primary"
              sx={{ 
                flexShrink: 0,
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

const BudgetaryPaymentPage: React.FC = () => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  const { data: budgetaryStats, refetch: refetchBudgetaryStats } = useListBudgetaryStatsQuery(undefined);

  const handleReload = () => {
    refetchBudgetary();
    refetchBudgetaryStats();
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
  const initialStatus = searchParams.get("status") || "pending";
  const [activeTab, setActiveTab] = useState(initialStatus);

  const {
    data: budgetaryApiResponse,
    isLoading: isBudgetaryLoading,
    refetch: refetchBudgetary
  } = useListBudgetaryPaymentsQuery({
    skip: paginationModel.page * paginationModel.pageSize,
    limit: paginationModel.pageSize,
    search: filterModel.quickFilterValues?.[0] || "",
    status: activeTab,
  });

  const rows = useMemo(() => {
    if (budgetaryApiResponse) {
      return budgetaryApiResponse.data.data.map((item: any) => {
        let displayStatus = item.payment_status || "Pending";
        const rawStatus = String(item.payment_status || "").toLowerCase();
        
        if (rawStatus === "a" || rawStatus === "approved") displayStatus = "Approved";
        else if (rawStatus === "r" || rawStatus === "rejected") displayStatus = "Rejected";
        else if (rawStatus === "p" || rawStatus === "pending") displayStatus = "Pending";

        return {
          ...item,
          id: item.id,
          status: displayStatus,
          date: item.date || item.created_date,
          supplierName: item.name_of_payee,
        };
      });
    }
    return [];
  }, [budgetaryApiResponse]);

  const statusCounts = useMemo(() => {
    const stats = budgetaryStats?.data;
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
  }, [rows, budgetaryStats]);

  const cards = [
    { key: "requested", label: "Requested", color: "#6366F1", count: statusCounts.requested },
    { key: "pending", label: "Pending", color: "#F59E0B", count: statusCounts.pending },
    { key: "approved", label: "Approved", color: "#10B981", count: statusCounts.approved },
    { key: "rejected", label: "Rejected", color: "#EF4444", count: statusCounts.rejected },
  ];

  const finalFilteredRows = useMemo(() => {
    return rows;
  }, [rows]);

  const totalCount = budgetaryApiResponse?.data?.total || 0;

  const handleOpenForm = React.useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const [processAction, { isLoading: isProcessing }] = useRequisitionActionMutation();
  const [getTransactions, { data: transactionsData, isLoading: isHistoryLoading }] = useGetTransactionsMutation();

  const historyData = Array.isArray(transactionsData) ? transactionsData : (transactionsData as any)?.data || [];

  const handleDownloadPDF = React.useCallback((id: number) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
    const token = localStorage.getItem("authToken");
    window.open(`${baseUrl}/budgetary-payments/${id}/download-pdf?token=${token}`, "_blank");
  }, []);

  const handleViewDetails = React.useCallback(async (id: number) => {
    setSelectedPaymentId(id);
    setIsDetailModalOpen(true);
    const record = rows.find((r) => r.id === id);
    if (record?.wf_inst_id) {
       getTransactions({ WF_INSTANCE_ID: String(record.wf_inst_id) });
    }
  }, [rows, getTransactions]);

  const handleCloseDetailModal = React.useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedPaymentId(null);
  }, []);

  const getStatusLabelAndColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "A": return { label: "Approved", color: "success", icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> };
      case "P": return { label: "Pending", color: "warning", icon: <HistoryIcon sx={{ fontSize: 16 }} /> };
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
        showToast(`Payment approved successfully`, "success");
        refetchBudgetary();
        refetchBudgetaryStats();
      } catch (err: any) {
        showToast(err?.data?.message || "Failed to approve payment", "error");
      }
    },
    [showToast, processAction, refetchBudgetary, refetchBudgetaryStats],
  );

  const handleReject = React.useCallback(
    (wf_inst_id?: number) => async () => {
      if (!wf_inst_id) {
        showToast("Workflow instance not found for this record", "error");
        return;
      }
      try {
        await processAction({ wf_inst_id, status: "R" }).unwrap();
        showToast(`Payment rejected successfully`, "success");
        refetchBudgetary();
        refetchBudgetaryStats();
      } catch (err: any) {
        showToast(err?.data?.message || "Failed to reject payment", "error");
      }
    },
    [showToast, processAction, refetchBudgetary, refetchBudgetaryStats],
  );

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
      headerName: "Name of Payee",
      flex: 1.5,
      minWidth: 180,
    },
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
      field: "invoice_number",
      headerName: "Invoice No.",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "invoice_date",
      headerName: "Invoice Date",
      flex: 1,
      minWidth: 120,
      renderCell: (params: any) => params.value ? formatSmartDate(params.value) : "N/A",
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
              "&:hover": { transform: "translateY(-4px)" },
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
            <CardContent sx={{ p: 1.5, pl: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Chip label={row.status} size="small" sx={{ fontWeight: 600 }} />
                <Typography variant="caption" color="textSecondary">{new Date(row.date).toLocaleDateString()}</Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight={700} noWrap>{row.supplierName}</Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="textSecondary">CJO No.</Typography>
                  <Typography variant="body2" fontWeight={500}>{row.cjo_no}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="textSecondary">Amount</Typography>
                  <Typography variant="body2" fontWeight={500}>₹{row.amount.toLocaleString()}</Typography>
                </Box>
              </Stack>
            </CardContent>
            <Box sx={{ p: 1, pl: 2.5, bgcolor: "action.hover", borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
              <IconButton size="small" onClick={() => handleViewDetails(row.id)}>
                <VisibilityIcon fontSize="small" />
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
        loading={isBudgetaryLoading}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        totalCount={totalCount}
        refetch={handleReload}
        title="Payment Voucher"
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

      <BudgetaryPaymentModal open={isCreateModalOpen} onClose={handleCloseModal} />

      <Dialog open={isDetailModalOpen} onClose={handleCloseDetailModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={700}>Payment Details</Typography>
          <IconButton onClick={handleCloseDetailModal} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
          {selectedPaymentId && (
            <Box sx={{ p: 3 }}>
              {/* Payment Information Section */}
              <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongIcon color="primary" /> Voucher Information
              </Typography>
              <Box sx={{ mb: 4 }}>
                {(() => {
                  const record = rows.find(r => r.id === selectedPaymentId);
                  if (!record) return null;
                  const fields = [
                    { label: "Name of Payee", value: record.name_of_payee || record.supplierName, icon: <BusinessIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Supplier Code", value: record.oracle_code || "N/A", icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Supplier Site Code", value: record.supplier_site_code || "N/A", icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Invoice Number", value: record.invoice_number || "N/A", icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Invoice Date", value: record.invoice_date ? formatSmartDate(record.invoice_date) : "N/A", icon: <EventAvailableIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Date", value: formatSmartDate(record.date), icon: <EventAvailableIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "CJO No.", value: record.cjo_no || "N/A", icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "PO/WO No.", value: record.po_wo_no || "N/A", icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Mode of Payment", value: record.mode_of_payment || "N/A", icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Total Amount", value: `₹${parseFloat(record.amount || 0).toLocaleString()}`, icon: <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Advance Adj.", value: `₹${parseFloat(record.advance_adj || 0).toLocaleString()}`, icon: <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "TDS Section", value: record.tds_section || "N/A", icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "TDS Amount", value: `₹${parseFloat(record.tds_amount || 0).toLocaleString()} (${record.tds_percentage || 0}%)`, icon: <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Segment 2", value: record.segment1 || "N/A", icon: <BusinessIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Segment 3", value: record.segment2 || "N/A", icon: <BusinessIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Segment 4", value: record.segment3 || "N/A", icon: <BusinessIcon color="primary" sx={{ fontSize: 20 }} /> },
                    { label: "Segment 5", value: record.segment4 || "N/A", icon: <BusinessIcon color="primary" sx={{ fontSize: 20 }} /> },
                  ];
                  return (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
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
                      <Box sx={{ mb: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                          Particulars of Payment
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: record.particulars_of_payment ? 'normal' : 'italic' }}>
                          {record.particulars_of_payment || "No particulars provided."}
                        </Typography>
                      </Box>
                    </>
                  );
                })()}
              </Box>

              {/* Attachments Section */}
              <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, borderTop: 1, pt: 3, borderColor: 'divider' }}>
                <AttachFileIcon color="primary" /> Supporting Documents
              </Typography>
              <BudgetaryAttachmentList paymentId={selectedPaymentId} />

              {/* Workflow History Section */}
              <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, borderTop: 1, pt: 3, borderColor: 'divider' }}>
                <HistoryIcon color="primary" /> Workflow History
              </Typography>
              <Box sx={{ mt: 2, pl: 2 }}>
                {isHistoryLoading ? (
                  <CircularProgress size={24} />
                ) : historyData.length > 0 ? (
                  historyData.map((step: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 0, position: 'relative' }}>
                      {/* Timeline Line */}
                      {idx !== historyData.length - 1 && (
                        <Box sx={{ 
                          position: 'absolute', 
                          left: 15, 
                          top: 30, 
                          bottom: -10, 
                          width: 2, 
                          bgcolor: 'divider',
                          zIndex: 0
                        }} />
                      )}
                      
                      {/* Timeline Dot */}
                      <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: `${getStatusLabelAndColor(step.status).color}.light`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        zIndex: 1,
                        mt: 0.5,
                        color: `${getStatusLabelAndColor(step.status).color}.main`
                      }}>
                        {getStatusLabelAndColor(step.status).icon}
                      </Box>

                      {/* Timeline Content */}
                      <Box sx={{ pb: 3, flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                            {getStatusLabelAndColor(step.status).label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatSmartDate(step.transaction_datetime)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {step.stk_name} ({step.wf_step_name})
                        </Typography>
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
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BudgetaryPaymentPage;
