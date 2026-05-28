import React, { useMemo, useState } from "react";
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
  useGridApiRef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { Box, Card, Typography, Chip, Button } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import HeightIcon from '@mui/icons-material/Height';
import DataGridHeader from "./DataGridHeader";
import LinearProgress from "./LinearProgress";
import ActionButtonsEdit from "./ActionButtonsEdit";
import ActionButtonsDelete from "./ActionButtonsDelete";
// Assuming you might want a View button later, or reuse Edit for view if read-only
// import ActionButtonsView from "./ActionButtonsView";

// Define Permission Interface
export interface GridPermissions {
  create: boolean;
  edit: boolean;
  delete: boolean;
  view?: boolean;
  download: boolean;
}

export interface ReusableDataGridProps {
  // Data
  rows: any[];
  columns: GridColDef[];
  totalCount: number;
  loading: boolean;

  // Pagination & Sorting State (Controlled)
  paginationModel: GridPaginationModel;
  setPaginationModel: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  setSortModel: (model: GridSortModel) => void;
  filterModel: GridFilterModel;
  setFilterModel: (model: GridFilterModel) => void;

  // Actions
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  onDownload?: (row: any) => void;
  refetch?: () => void;

  // Config
  title?: string;
  addButtonLabel?: string;
  uniqueIdField?: string;
  rowHeight?: number;
  height?: string | number;

  // Permissions
  permissions?: GridPermissions;

  // Custom Controls
  headerControls?: React.ReactNode;

  // View Mode Config
  viewMode?: "table" | "card";
  cardRenderer?: (rows: any[]) => React.ReactNode;
}

const ReusableDataGrid: React.FC<ReusableDataGridProps> = ({
  rows,
  columns,
  totalCount,
  loading,
  paginationModel,
  setPaginationModel,
  sortModel,
  setSortModel,
  filterModel,
  setFilterModel,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onDownload,
  refetch,
  title = "List",
  addButtonLabel = "Add New",
  uniqueIdField = "id",
  rowHeight = 40,
  permissions = {
    create: true,
    edit: true,
    delete: true,
    view: true,

    download: true,
  },
  headerControls,
  viewMode = "table",
  cardRenderer,
  height,
}) => {
  const apiRef = useGridApiRef();

  // Active filters for chips display
  const activeFilters = useMemo(() => {
    const filters: Array<{ field: string; value: string }> = [];

    // Quick filter
    if (
      filterModel.quickFilterValues &&
      filterModel.quickFilterValues.length > 0
    ) {
      filters.push({
        field: "Search",
        value: filterModel.quickFilterValues.join(" "),
      });
    }

    // Column filters
    filterModel.items.forEach((item) => {
      if (
        item.value !== undefined &&
        item.value !== null &&
        item.value !== ""
      ) {
        let displayValue = String(item.value);
        if (typeof item.value === "boolean") {
          displayValue = item.value ? "Active" : "Inactive";
        }
        filters.push({
          field: item.field,
          value: displayValue,
        });
      }
    });

    return filters;
  }, [filterModel]);

  const removeFilter = (filterType: string, filterValue?: string) => {
    if (filterType === "Search") {
      setFilterModel({ ...filterModel, quickFilterValues: [] });
    } else {
      setFilterModel({
        ...filterModel,
        items: filterModel.items.filter((item) => item.field !== filterType),
      });
    }
  };

  const clearAllFilters = () => {
    setFilterModel({ items: [], quickFilterValues: [] });
  };

  // Augment columns with Actions if needed
  const finalColumns = useMemo(() => {
    const cols = [...columns];

    // Check if we need an actions column
    const hasEdit = !!onEdit && permissions.edit;
    const hasDelete = !!onDelete && permissions.delete;

    // const hasView = !!onView && permissions.view;

    if (hasEdit || hasDelete) {
      cols.push({
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              height: "100%",
              alignItems: "center",
              justifyContent: "center",

              width: "100%",
            }}
          >
            {hasEdit && (
              <ActionButtonsEdit
                onEdit={() => onEdit && onEdit(params.row)}
                editTooltip="Edit"
              />
            )}
            {hasDelete && (
              <ActionButtonsDelete
                onDelete={() => onDelete && onDelete(params.row)}
                deleteTooltip="Delete"
              />
            )}
          </Box>
        ),
      });
    }
    return cols;
  }, [columns, onEdit, onDelete, permissions]);

  return (
    <Card
      sx={{
        borderRadius: "4px",
        border: "none",
        boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.06)",
        height: height || "calc(100vh - 125px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={finalColumns}
          rowCount={totalCount}
          loading={loading}
          getRowId={(row) => row[uniqueIdField]}
          // Server-side props
          pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          sortingOrder={['asc', 'desc']}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={setFilterModel} // Capture filter changes from the panel/quick filter
          disableRowSelectionOnClick
          pageSizeOptions={[15, 25, 50, 100]}
          apiRef={apiRef}
          density="standard"
          // rowHeight={rowHeight}
          getRowHeight={() => "auto"}
          columnHeaderHeight={40}
          // Toolbar
          showToolbar
          slots={{
            toolbar: DataGridHeader,
            loadingOverlay: LinearProgress,
            columnUnsortedIcon: HeightIcon as any,
            columnSortedAscendingIcon: ArrowUpwardIcon as any,
            columnSortedDescendingIcon: ArrowDownwardIcon as any,
          }}
          slotProps={{
            toolbar: {
              title,
              refetch,
              onAdd: permissions.create ? onAdd : undefined,
              addButtonLabel,
              showExport: permissions.download,
              headerControls,
            },
            filterPanel: {
              filterFormProps: {
                operatorInputProps: { sx: { display: "none" } },
                columnInputProps: { sx: { width: 160 } },
                valueInputProps: { sx: { width: 160 } },
              },
            },
          }}
          // Styling
          sx={{
            /* ================= CONTAINER ================= */
            flex: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "4px",
            backgroundColor: "background.paper",
            boxShadow: (theme) => theme.palette.mode === 'dark' ? "0 4px 6px -1px rgba(0,0,0,0.5)" : "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)",
            overflow: "hidden",

            "& .MuiDataGrid-main": {
              overflow: "hidden",
            },
            "& .MuiDataGrid-virtualScroller": {
              overflowY: "auto",
            },

            /* ================= HEADER ================= */
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "background.default",
              borderBottom: 1,
              borderColor: "divider",
            },
            "& .MuiDataGrid-columnHeader": {
              padding: "12px 16px",
              "&:focus, &:focus-within": {
                outline: "none",
              },
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "text.secondary",
            },
            // Always show sort icon
            "& .MuiDataGrid-iconButtonContainer": {
              visibility: "visible",
              width: "auto",
            },
            "& .MuiDataGrid-sortIcon": {
              opacity: 0.3, // Dim unsorted icon
            },
            "& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon": {
              opacity: 1, // Full opacity for sorted
            },

            /* ================= ROW ================= */
            "& .MuiDataGrid-row": {
              cursor: "pointer",
              transition: "all 0.15s ease-in-out",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            },

            /* ================= CELL ================= */
            "& .MuiDataGrid-cell": {
              padding: "12px 16px",
              fontSize: "0.875rem",
              color: "text.primary",
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              "&:focus, &:focus-within": {
                outline: "none",
              },
            },

            /* ================= FILTER PANEL ================= */
            "& .MuiDataGrid-filterForm": {
              display: "flex",
              gap: "12px",
              alignItems: "flex-end",
              padding: "10px 12px",
              flexWrap: "nowrap",
            },
            "& .MuiDataGrid-filterFormOperatorInput": {
              display: "none !important",
            },
            "& .MuiDataGrid-filterFormColumnInput": {
              flex: "0 0 auto",
              width: 160,
            },
            "& .MuiDataGrid-filterFormValueInput": {
              flex: "0 0 auto",
              width: 160,
            },

            /* ================= SCROLLBAR ================= */
            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track": {
              backgroundColor: "action.hover",
            },
            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
              backgroundColor: "action.selected",
              borderRadius: "4px",
            },
          }}
        />
        {viewMode === "card" && cardRenderer && (
          <Box
            sx={{
              position: "absolute",
              top: 64, // Height of header
              bottom: 52, // Height of footer
              left: 0,
              right: 0,
              bgcolor: "background.paper",
              zIndex: 2,
              overflowY: "auto",
              p: 2,
            }}
          >
            {cardRenderer(rows)}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ReusableDataGrid;
