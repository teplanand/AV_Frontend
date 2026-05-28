// src/pages/company/CompanyIndex.tsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import {
  GridColDef,
  GridRenderCellParams,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridFilterItem,
} from "@mui/x-data-grid";
import { useToast } from "../../../hooks/useToast";
import ConfirmDialog from "../../../components/ConfirmDialog";
import {
  useListCompaniesQuery,
  useSoftDeleteCompanyMutation,
  useUpdateCompanyMutation,
} from "../../../redux/api/company";
import CompanyForm from "./form";
import ReusableDataGrid from "../../../components/common/ReusableDataGrid";
import Snackbar from "@mui/material/Snackbar";
import Alert, { AlertProps } from "@mui/material/Alert";

import { getIdColumn, getStatusColumn } from "../../../utils/gridColumns";
import GridErrorOverlay from "../../../components/common/GridErrorOverlay";
import { givePermission } from "../../../utils/givePermission";

const CompanyList: React.FC = () => {
  const { showToast } = useToast();

  // Grid state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 15,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "id", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });

  // Convert filter model to API parameters (SIMPLIFIED)
  const buildApiParams = useCallback((filterModel: GridFilterModel) => {
    const params: any = {};

    // Handle quick filter (global search)
    if (
      filterModel.quickFilterValues &&
      filterModel.quickFilterValues.length > 0
    ) {
      params.search = filterModel.quickFilterValues.join(" ");
    }

    // Handle individual column filters (simple key-value pairs)
    filterModel.items.forEach((item: GridFilterItem) => {
      if (
        item.value === undefined ||
        item.value === null ||
        item.value === ""
      ) {
        return;
      }

      // Direct mapping: field name to parameter name
      params[item.field] = item.value;
    });

    return params;
  }, []);

  // Get API parameters
  const apiParams = useMemo(() => {
    const params = buildApiParams(filterModel);
    return {
      skip: paginationModel.page * paginationModel.pageSize,
      limit: paginationModel.pageSize,
      sort_by: sortModel.length > 0 ? String(sortModel[0].field) : "id",
      sort_order: sortModel.length > 0 ? sortModel[0].sort || "desc" : "desc",
      ...params,
    };
  }, [paginationModel, sortModel, filterModel, buildApiParams]);

  const {
    data,
    error: apiError,
    isLoading,
    isFetching,
    refetch,
  } = useListCompaniesQuery(apiParams);

  const rows = data?.data?.data || [];
  const totalCount = data?.data?.total || 0;

  const [softDeleteCompany, { isLoading: isDeleting }] =
    useSoftDeleteCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();

  const [openForm, setOpenForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    id: null as number | null,
    name: "",
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState<number | null>(null);

  const [dataError, setDataError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<AlertProps | null>(null);

  useEffect(() => {
    if (apiError) {
      const msg =
        (apiError as any)?.data?.message ||
        (apiError as any)?.message ||
        "Failed to fetch";
      setDataError(msg);
      setSnackbar({ children: msg, severity: "error" });
    } else setDataError(null);
  }, [apiError]);

  const handleCloseSnackbar = () => setSnackbar(null);

  // Handlers
  const handleOpenForm = (company?: any) => {
    setSelectedCompany(company || null);
    setOpenForm(true);
  };
  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedCompany(null);
  };
  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  const handleStatusToggle = async (company: any) => {
    setIsLoadingStatus(company.id);
    try {
      const newStatus = !company.is_active;
      await updateCompany({
        id: company.id,
        data: { ...company, is_active: newStatus },
      }).unwrap();
      showToast(
        `Company ${newStatus ? "activated" : "deactivated"} successfully`,
        "success",
      );
      refetch();
    } catch (err: any) {
      console.error("Failed to update company status:", err);
      showToast(
        err?.data?.message || "Failed to update company status",
        "error",
      );
    } finally {
      setIsLoadingStatus(null);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Company",
      message: `Are you sure you want to delete company "${name}"? This action cannot be undone.`,
      id,
      name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (confirmDialog.id) {
      try {
        await softDeleteCompany(confirmDialog.id).unwrap();
        showToast("Company deleted successfully", "success");
        refetch();
      } catch (err: any) {
        console.error("Failed to delete company:", err);
        showToast(err?.data?.message || "Failed to delete company", "error");
      }
    }
    setConfirmDialog({
      open: false,
      title: "",
      message: "",
      id: null,
      name: "",
    });
  };

  const formatMobile = (ccode: string | null, mobile: string | null) => {
    if (!mobile) return "N/A";
    if (ccode) return `${ccode} ${mobile}`;
    return mobile;
  };

  const columns: GridColDef[] = useMemo(
    () => [
      getIdColumn(),

      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 200,
        filterable: true,
        headerAlign: "left",
      },
      {
        field: "legal_name",
        headerName: "Legal Name",
        flex: 1,
        minWidth: 150,
        filterable: true,
        headerAlign: "left",
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 180,
        filterable: true,
        headerAlign: "left",
      },
      {
        field: "mobile",
        headerName: "Phone",
        flex: 1,
        minWidth: 130,
        renderCell: (params: GridRenderCellParams) =>
          formatMobile(params.row.ccode_mobile, params.value),
        filterable: true,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "gst_number",
        headerName: "GST Number",
        width: 150,
        filterable: true,
        align: "center",
        headerAlign: "center",
      },
      getStatusColumn({
        onToggle: handleStatusToggle,
        loadingId: isLoadingStatus,
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoadingStatus],
  );

  return (
    <Box>
      <ReusableDataGrid
        rows={rows}
        columns={columns}
        totalCount={totalCount}
        loading={isLoading || isFetching}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        title="Company"
        onAdd={() => handleOpenForm()}
        onEdit={(row) => handleOpenForm(row)}
        onDelete={(row) => handleDeleteClick(row.id, row.name)}
        refetch={refetch}
        permissions={{
          create: givePermission("company", "add"),
          edit: givePermission("company", "edit"),
          delete: givePermission("company", "delete"),
          download: givePermission("company", "download"),
        }}
      />

      {!!snackbar && (
        <Snackbar
          open
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          onClose={handleCloseSnackbar}
          autoHideDuration={6000}
        >
          <Alert {...snackbar} onClose={handleCloseSnackbar} />
        </Snackbar>
      )}

      {dataError && <GridErrorOverlay error={dataError} />}

      {/* Dialogs */}
      <CompanyForm
        open={openForm}
        company={selectedCompany}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            id: null,
            name: "",
          })
        }
        severity="error"
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />
    </Box>
  );
};

export default CompanyList;
