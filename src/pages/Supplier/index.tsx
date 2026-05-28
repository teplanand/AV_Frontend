import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from "@mui/x-data-grid";
import { Page } from "../../components/common/Page";
import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import { useListSuppliersQuery, useSoftDeleteSupplierMutation } from "../../redux/api/suppliers";
import SupplierFormDrawer from "./SupplierFormDrawer";

const SupplierPage: React.FC = () => {
    // Grid States
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 15,
    });
    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [filterModel, setFilterModel] = useState<GridFilterModel>({
        items: [],
        quickFilterValues: [],
    });

    // Form Drawer States
    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // API Mutations
    const [deleteSupplier] = useSoftDeleteSupplierMutation();

    // Query Data
    const { data, isLoading, refetch } = useListSuppliersQuery({
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        search:
            filterModel.quickFilterValues && filterModel.quickFilterValues.length > 0
                ? filterModel.quickFilterValues.join(" ")
                : "",
        sort_by: sortModel[0]?.field || "id",
        sort_order: sortModel[0]?.sort || "desc",
    });

    const columns: GridColDef[] = [
        { field: "supplier_code", headerName: "Supplier Code", flex: 1, minWidth: 150 },
        { field: "supplier_name", headerName: "Supplier Name", flex: 1, minWidth: 200 },
        { field: "supplier_type", headerName: "Supplier Type", flex: 1, minWidth: 150 },
        { field: "supplier_address", headerName: "Supplier Address", flex: 1.5, minWidth: 250 },
    ];

    const handleAdd = () => {
        setSelectedRow(null);
        setOpenDrawer(true);
    };

    const handleEdit = (row: any) => {
        setSelectedRow(row);
        setOpenDrawer(true);
    };

    const handleDelete = async (row: any) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this supplier? You won't be able to revert this!");

        if (isConfirmed) {
            try {
                await deleteSupplier(row.id).unwrap();
            } catch (err) {
                console.error("Failed to delete supplier:", err);
            }
        }
    };

    return (
        <Page module="master">
            <Box sx={{ p: 0 }}>
                <ReusableDataGrid
                    rows={data?.data?.data || []}
                    columns={columns}
                    totalCount={data?.data?.total || 0}
                    loading={isLoading}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    sortModel={sortModel}
                    setSortModel={setSortModel}
                    filterModel={filterModel}
                    setFilterModel={setFilterModel}
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    refetch={refetch}
                    title="Supplier List"
                    addButtonLabel="Add Supplier"
                    permissions={{
                        create: true, // Show Add button
                        edit: true,
                        delete: true,
                        download: true,
                    }}
                />
            </Box>

            <SupplierFormDrawer
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                selectedRow={selectedRow}
            />
        </Page>
    );
};

export default SupplierPage;
