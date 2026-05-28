import React from "react";
import { Box, Typography } from "@mui/material";
import { Page } from "../../components/common/Page";
import WorkflowPendingList from "../../components/WorkflowPendingList";

const WorkflowPage: React.FC = () => {
    return (
        <Page module="dashboard">
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Workflow Management
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                    Manage and approve pending workflow requests assigned to you.
                </Typography>
                
                <WorkflowPendingList />
            </Box>
        </Page>
    );
};

export default WorkflowPage;
