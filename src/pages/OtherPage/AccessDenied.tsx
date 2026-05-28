import React from "react";
import { Link } from "react-router";
import GridShape from "../../components/common/GridShape";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Box, Typography, Button, useTheme } from "@mui/material";

export default function AccessDenied() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        p: 3,
        overflow: "hidden",
        bgcolor: "background.default",
        color: "text.primary",
        zIndex: 1,
      }}
    >
      <GridShape />
      <Box
        sx={{
          mx: "auto",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          "@media (min-width: 600px)": {
            maxWidth: 500,
          },
        }}
      >
        {/* <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(254, 226, 226, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 40, color: "error.main" }} />
          </Box>
        </Box> */}

        {/* <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                        fontWeight: 800,
                        mb: 2,
                        fontSize: { xs: "1.875rem", sm: "2.25rem" },
                        color: "text.primary",
                    }}
                >
                    Access Denied
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        mb: 4,
                        width: "100%",
                        fontSize: { xs: "1rem", sm: "1.125rem" },
                        color: "text.secondary",
                        lineHeight: 1.6,
                    }}
                >
                    You do not have permission to view this page. Please contact your
                    administrator if you believe this is an error.
                </Typography> */}

        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 600,
            borderRadius: '4px',
            textTransform: "none",
            bgcolor: "primary.main",
            "&:hover": {
              bgcolor: "primary.dark",
              boxShadow: 4,
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s",
          }}
        >
          Go Back Home
        </Button>
      </Box>

      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          color: "text.disabled",
        }}
      >
        &copy; {new Date().getFullYear()} - hi-lab
      </Typography>
    </Box>
  );
}
