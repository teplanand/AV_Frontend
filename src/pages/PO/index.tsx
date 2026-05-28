import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from "@mui/x-data-grid";
import { Page } from "../../components/common/Page";
import ReusableDataGrid from "../../components/common/ReusableDataGrid";

import { useListPODetailsQuery } from "../../redux/api/po_details";

const POPage: React.FC = () => {
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 15,
    });
    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [filterModel, setFilterModel] = useState<GridFilterModel>({
        items: [],
        quickFilterValues: [],
    });

    const { data, isLoading, refetch } = useListPODetailsQuery({
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
        { field: "item_code", headerName: "Item Code", flex: 1, minWidth: 120 },
        { field: "item_desc", headerName: "Item Description", flex: 1.5, minWidth: 250 },
        { field: "item_qty", headerName: "Quantity", flex: 0.5, minWidth: 100, type: 'number', align: 'right', headerAlign: 'right' },
        { field: "trn_currency", headerName: "Currency", flex: 0.5, minWidth: 100, align: 'center', headerAlign: 'center' },
        {
            field: "item_amount",
            headerName: "Amount",
            flex: 1,
            minWidth: 150,
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            valueFormatter: (value) => {
                if (value == null) return '';
                return (value as number).toLocaleString(undefined, { minimumFractionDigits: 2 });
            }
        },
    ];

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
                    title="Purchase Order Items"
                    refetch={refetch}
                    permissions={{
                        create: false,
                        edit: false,
                        delete: false,
                        download: true
                    }}
                />
            </Box>
        </Page>
    );
};

export default POPage;
