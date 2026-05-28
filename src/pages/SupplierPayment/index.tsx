import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Stack,
  Divider,
  TextField,
  InputAdornment,
  Pagination,
  Button,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import {
  GridColDef,
  GridRenderCellParams,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";

import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import { useToast } from "../../hooks/useToast";
import { requisitionsData, dashboardStats } from "../../services/mockData";
import { useNavigate } from "react-router";
import CreateRequisitionModal from "../Dashboard/CreateRequisitionModal";

interface DashboardProps {
  type: "supplier" | "internal";
}

const StatCard = ({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) => (
  <Card
    sx={{
      height: "100%",
      background: (theme) =>
        theme.palette.mode === "dark"
          ? theme.palette.background.paper
          : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
      border: 1,
      borderColor: "divider",
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 12px 24px -10px rgba(0,0,0,0.5)"
            : "0 12px 24px -10px rgba(0,0,0,0.1)",
        borderColor: color,
      },
    }}
  >
    <CardContent>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="h4"
        sx={{ fontWeight: "bold", color: color, fontFamily: "Nunito" }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

// Helper for Mock Data details
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

const AdvancePaymentDashboard: React.FC<DashboardProps> = ({ type }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // View Mode State
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Details Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<
    string | null
  >(null);

  // Card View Search & Pagination State
  const [cardSearch, setCardSearch] = useState("");
  const [cardPage, setCardPage] = useState(1);
  const CARD_PAGE_SIZE = 9;

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

  const [activeTab, setActiveTab] = useState("pending");

  // Since we are mocking, we just use the mock data as 'rows'
  const rows = useMemo(() => {
    return requisitionsData.map((item) => ({ ...item, id: item.id }));
  }, []);

  const filteredRows = useMemo(() => {
    // Filter by active tab status (case-insensitive)
    return rows.filter(
      (r) => r.status.toLowerCase() === activeTab.toLowerCase(),
    );
  }, [rows, activeTab]);

  const activeRowsCount = filteredRows.length;

  // Dynamically calculate counts based on rows
  const statusCounts = useMemo(() => {
    return {
      requested: rows.filter((r) => r.status.toLowerCase() === "requested")
        .length,
      pending: rows.filter((r) => r.status.toLowerCase() === "pending").length,
      approved: rows.filter((r) => r.status.toLowerCase() === "approved")
        .length,
      rejected: rows.filter((r) => r.status.toLowerCase() === "rejected")
        .length,
    };
  }, [rows]);

  // --- Card View Logic ---
  const filteredCardRows = useMemo(() => {
    // Apply Tab Filter AND Search
    let data = rows.filter(
      (r) => r.status.toLowerCase() === activeTab.toLowerCase(),
    );

    if (!cardSearch) return data;
    const lowerSearch = cardSearch.toLowerCase();
    return data.filter(
      (r) =>
        r.supplierName.toLowerCase().includes(lowerSearch) ||
        r.requestRef.toLowerCase().includes(lowerSearch) ||
        r.poNo.includes(cardSearch),
    );
  }, [rows, cardSearch, activeTab]);

  const paginatedCardRows = useMemo(() => {
    const start = (cardPage - 1) * CARD_PAGE_SIZE;
    return filteredCardRows.slice(start, start + CARD_PAGE_SIZE);
  }, [filteredCardRows, cardPage]);

  const cardTotalPages = Math.ceil(filteredCardRows.length / CARD_PAGE_SIZE);

  const totalCount = filteredRows.length;
  const isLoading = false;

  const handleOpenForm = (id?: string) => {
    if (id) {
      showToast(`Edit functionality mock for ID: ${id}`, "info");
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };


  const handleViewDetails = (id: string) => {
    setSelectedRequisitionId(id);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequisitionId(null);
  };

  const handleAccept = React.useCallback(
    (id: string) => () => {
      showToast(`Accepted requisition ${id}`, "success");
    },
    [showToast],
  );

  const handleReject = React.useCallback(
    (id: string) => () => {
      showToast(`Rejected requisition ${id}`, "error");
    },
    [showToast],
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "requestRef",
        headerName: "Request Ref",
        flex: 1,
        minWidth: 200,
        filterable: true,
      },
      {
        field: "supplierName",
        headerName: "Supplier Name",
        flex: 1,
        minWidth: 200,
        filterable: true,
      },
      {
        field: "poNo",
        headerName: "PO No",
        flex: 1,
        minWidth: 150,
        filterable: true,
      },
      {
        field: "poAmount",
        headerName: "PO Amount",
        flex: 1,
        minWidth: 150,
        type: "number",
        renderCell: (params: GridRenderCellParams) => (
          <span>₹{params.value?.toLocaleString()}</span>
        ),
      },
      {
        field: "advanceAmount",
        headerName: "Advance Amount",
        flex: 1,
        minWidth: 150,
        type: "number",
        renderCell: (params: GridRenderCellParams) => (
          <span>₹{params.value?.toLocaleString()}</span>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams) => {
          let color:
            | "default"
            | "primary"
            | "secondary"
            | "error"
            | "info"
            | "success"
            | "warning" = "default";
          let bgcolor = "#eee";
          let textcolor = "#333";

          switch (params.value) {
            case "Approved":
              color = "success";
              bgcolor = "#DEF7EC";
              textcolor = "#03543F";
              break;
            case "Rejected":
              color = "error";
              bgcolor = "#FDE8E8";
              textcolor = "#9B1C1C";
              break;
            case "Pending":
              color = "warning";
              bgcolor = "#FEF3C7";
              textcolor = "#92400E";
              break;
            default:
              bgcolor = "#E1EFFE";
              textcolor = "#1E429F";
          }

          return (
            <Chip
              label={params.value}
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
        getActions: (params) => [
          <GridActionsCellItem
            icon={<VisibilityIcon color="info" />}
            label="View Details"
            onClick={() => handleViewDetails(params.id as string)}
            showInMenu={false}
          />,
          // <GridActionsCellItem
          //     icon={<EditIcon color="primary" />}
          //     label="Edit"
          //     onClick={() => handleOpenForm(params.id as string)}
          //     showInMenu
          // />,
          // <GridActionsCellItem
          //     icon={<DeleteIcon color="error" />}
          //     label="Delete"
          //     onClick={() => handleDeleteClick(params.id as string, params.row.requestRef)}
          //     showInMenu
          // />,
          <GridActionsCellItem
            icon={<CheckCircleIcon color="success" />}
            label="Accept"
            onClick={handleAccept(params.id as string)}
            showInMenu={false}
          />,
          <GridActionsCellItem
            icon={<CancelIcon color="error" />}
            label="Reject"
            onClick={handleReject(params.id as string)}
            showInMenu={false}
          />,
        ],
      },
    ],
    [handleAccept, handleReject],
  );

  return (
    <Box>
      {/* Status Tabs & Create Action */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        {[
          {
            key: "requested",
            label: "Requested",
            color: "#64748b",
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
        ].map((tab) => (
          <Box key={tab.key}>
            <Card
              onClick={() => setActiveTab(tab.key)}
              sx={{
                height: "100%",
                cursor: "pointer",
                background: (theme) =>
                  activeTab === tab.key
                    ? theme.palette.mode === "dark"
                      ? theme.palette.action.selected
                      : "#fff"
                    : theme.palette.mode === "dark"
                      ? theme.palette.background.paper
                      : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                border: 1,
                borderColor: activeTab === tab.key ? tab.color : "divider",
                boxShadow:
                  activeTab === tab.key
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

      {/* Content Switch */}
      {viewMode === "table" ? (
        <ReusableDataGrid
          rows={filteredRows}
          columns={columns}
          totalCount={totalCount}
          loading={isLoading}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          sortModel={sortModel}
          setSortModel={setSortModel}
          filterModel={filterModel}
          setFilterModel={setFilterModel}
          title={type === "supplier" ? "Supplier Payment" : "Internal Payment"}
          addButtonLabel=" "
          onAdd={() => handleOpenForm()}
          refetch={() => { }}
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
      ) : (
        <>
          {/* Card View Header Control */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              aria-label="view mode"
              size="small"
              sx={{ height: 32, bgcolor: "background.paper" }}
            >
              <ToggleButton value="table" aria-label="table view">
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" aria-label="card view">
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {paginatedCardRows.map((row) => (
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

                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, pl: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1.5,
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
                      sx={{ fontSize: "1.1rem", mb: 2 }}
                    >
                      {row.supplierName}
                    </Typography>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="#64748b">
                          PO Number
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {row.poNo}
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
                          Date
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {new Date(row.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Divider sx={{ borderStyle: "dashed", my: 1 }} />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="#64748b">
                          Total PO Value
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          ₹{row.poAmount.toLocaleString()}
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
                          Advance Reqd
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="#F37440"
                        >
                          ₹{row.advanceAmount.toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <Box
                    sx={{
                      p: 1.5,
                      pl: 3.5,
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
                        <VisibilityIcon
                          fontSize="small"
                          sx={{ color: "#64748b" }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenForm(row.id)}
                      >
                        <EditIcon fontSize="small" sx={{ color: "#64748b" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton size="small" onClick={handleReject(row.id)}>
                        <CancelIcon
                          fontSize="small"
                          sx={{ color: "#ef4444" }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Approve">
                      <IconButton size="small" onClick={handleAccept(row.id)}>
                        <CheckCircleIcon
                          fontSize="small"
                          sx={{ color: "#22c55e" }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Box>
            ))}
            {paginatedCardRows.length === 0 && (
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

          {/* Pagination Control */}
          {filteredCardRows.length > CARD_PAGE_SIZE && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={cardTotalPages}
                page={cardPage}
                onChange={(_, p) => setCardPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Requisition Modal */}
      <CreateRequisitionModal
        open={isCreateModalOpen}
        onClose={handleCloseModal}
      />

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
          <IconButton onClick={handleCloseDetailModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedRequisitionId && (
            <Box
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow
                      sx={{
                        "& th": { fontWeight: 600, color: "text.secondary" },
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
                    {getCheckDetails(selectedRequisitionId).map(
                      (detailRow, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{ fontWeight: 500 }}
                          >
                            {detailRow.name}
                          </TableCell>
                          <TableCell align="right">{detailRow.poQty}</TableCell>
                          <TableCell align="right">
                            {detailRow.reqQty}
                          </TableCell>
                          <TableCell align="right">
                            {detailRow.pendingQty}
                          </TableCell>
                          <TableCell align="right">
                            ₹{detailRow.price.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            ₹{detailRow.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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

export default AdvancePaymentDashboard;
