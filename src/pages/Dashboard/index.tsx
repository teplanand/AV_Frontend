import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useGetRequisitionStatsQuery } from "../../redux/api/requisitions";
import { useListBudgetaryStatsQuery } from "../../redux/api/budgetary_payments";

const AdvancePaymentDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch real stats
  const { data: supplierStats } = useGetRequisitionStatsQuery(undefined);
  const { data: budgetaryStats } = useListBudgetaryStatsQuery(undefined);

  const getStats = (type: "supplier" | "budgetary") => {
    const stats =
      type === "supplier" ? supplierStats?.data : budgetaryStats?.data;
    return {
      requested: stats?.requested || stats?.cr || 0,
      pending: stats?.pending || 0,
      approved: stats?.approved || 0,
      rejected: stats?.rejected || 0,
    };
  };

  const getCards = (type: "supplier" | "budgetary") => {
    const counts = getStats(type);
    return [
      {
        key: "requested",
        label: "Requested",
        color: "#6366F1",
        count: counts.requested,
      },
      {
        key: "pending",
        label: "Pending",
        color: "#F59E0B",
        count: counts.pending,
      },
      {
        key: "approved",
        label: "Approved",
        color: "#10B981",
        count: counts.approved,
      },
      {
        key: "rejected",
        label: "Rejected",
        color: "#EF4444",
        count: counts.rejected,
      },
    ];
  };

  const renderCardSection = (
    title: string,
    path: string,
    type: "supplier" | "budgetary",
  ) => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        {title}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {getCards(type).map((tab) => (
          <Box key={tab.key} onClick={() => navigate(`${path}?status=${tab.key}`)}>
            <Card
              sx={{
                height: "100%",
                cursor: "pointer",
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.background.paper
                    : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                border: 1,
                borderColor: "divider",
                transition:
                  "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: tab.color,
                  boxShadow: `0 4px 12px -2px ${tab.color}40`,
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
    </Box>
  );

  return (
    <Box>
      {renderCardSection(
        "Supplier Payment",
        "/app/advance-payment/supplier-payment",
        "supplier",
      )}
      {renderCardSection(
        "Payment Voucher",
        "/app/advance-payment/payment-voucher",
        "budgetary",
      )}
    </Box>
  );
};

export default AdvancePaymentDashboard;
