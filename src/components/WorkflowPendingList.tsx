import React from "react";
import { useGetPendingRequisitionsQuery, useRequisitionActionMutation } from "../redux/api/requisitions";
import { toast } from "react-toastify";
import styled from "@emotion/styled";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Button, 
    Typography,
    Box,
    CircularProgress,
    Chip
} from "@mui/material";

const WorkflowPendingList: React.FC = () => {
    const { data: response, isLoading, refetch } = useGetPendingRequisitionsQuery();
    const [processAction, { isLoading: isProcessing }] = useRequisitionActionMutation();

    const handleAction = async (instanceId: number, status: string) => {
        try {
            await processAction({
                wf_inst_id: instanceId,
                status: status
            }).unwrap();
            toast.success(`Action processed successfully`);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to process workflow action");
        }
    };

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    const pendingRequests = response?.data || [];

    if (pendingRequests.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                <Typography color="textSecondary">No pending workflow requests found.</Typography>
            </Paper>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={700}>Pending Workflow Approvals</Typography>
            </Box>
            <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                        <TableCell>Instance ID</TableCell>
                        <TableCell>Sequence</TableCell>
                        <TableCell>Stakeholder</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pendingRequests.map((req: any) => (
                        <TableRow key={req.WF_TransactionId}>
                            <TableCell sx={{ fontWeight: 600 }}>{req.WF_INSTANCE_ID}</TableCell>
                            <TableCell>{req.SEQ}</TableCell>
                            <TableCell>{req.STK_NAME}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={req.STATUS === 'P' ? 'Pending' : req.STATUS} 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined" 
                                />
                            </TableCell>
                            <TableCell>{new Date(req.TRANSACTION_DATETIME).toLocaleString()}</TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Button 
                                        size="small"
                                        variant="contained" 
                                        color="success"
                                        onClick={() => handleAction(parseInt(req.WF_INSTANCE_ID), "A")}
                                        disabled={isProcessing}
                                    >
                                        Approve
                                    </Button>
                                    <Button 
                                        size="small"
                                        variant="outlined" 
                                        color="warning"
                                        onClick={() => handleAction(parseInt(req.WF_INSTANCE_ID), "B")}
                                        disabled={isProcessing}
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        size="small"
                                        variant="contained" 
                                        color="error"
                                        onClick={() => handleAction(parseInt(req.WF_INSTANCE_ID), "R")}
                                        disabled={isProcessing}
                                    >
                                        Reject
                                    </Button>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default WorkflowPendingList;
