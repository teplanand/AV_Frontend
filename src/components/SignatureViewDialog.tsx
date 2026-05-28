// src/components/SignatureViewDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Stack,
} from "@mui/material";
import { Close, Edit } from "@mui/icons-material";
import { useGetDocumentByIdQuery } from "../redux/api/document";

interface SignatureViewDialogProps {
  open: boolean;
  onClose: () => void;
  signatureId: number;
  doctorName?: string;
  doctorId?: number;
  onRedrawSignature?: (doctorId: number) => void;
}

const SignatureViewDialog: React.FC<SignatureViewDialogProps> = ({
  open,
  onClose,
  signatureId,
  doctorName = "",
  doctorId,
  onRedrawSignature,
}) => {
  const {
    data: signatureDocument,
    isLoading,
    error,
  } = useGetDocumentByIdQuery(signatureId, {
    skip: !signatureId,
  });

  // Debug logging
  React.useEffect(() => {
    if (signatureDocument) {
      console.log("Signature Document Data:", signatureDocument);
      console.log("Document Path:", signatureDocument.path);
      console.log("Has Path:", !!signatureDocument.path);
    }
    if (error) {
      console.error("Error fetching signature:", error);
    }
  }, [signatureDocument, error]);

  const getFullImageUrl = (path: string) => {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    return `${cleanBaseUrl}/${cleanPath}`;
  };

  const handleRedraw = () => {
    if (doctorId && onRedrawSignature) {
      onRedrawSignature(doctorId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6">View Signature</Typography>
          {doctorName && (
            <Typography variant="caption" color="text.secondary">
              For: {doctorName}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : signatureDocument?.path ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Box
              sx={{
                border: "2px solid",
                borderColor: "divider",
                borderRadius: '4px',
                p: 1,
                backgroundColor: "#f5f5f5",
                backgroundImage: `
                  linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                  linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                  linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                `,
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                maxWidth: "100%",
                maxHeight: 350,
                overflow: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src={getFullImageUrl(signatureDocument.path)}
                alt="Signature"
                sx={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  backgroundColor: "white",
                  padding: 1,
                  borderRadius: '4px',
                }}
                onError={(e) => {
                  console.error("Failed to load signature image:", e);
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";

                  // Show error message
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div style="
                        color: #d32f2f;
                        font-size: 16px;
                        text-align: center;
                        width: 100%;
                        padding: 20px;
                        background: white;
                        border-radius: 4px;
                      ">
                        Failed to load signature image<br/>
                        <small>URL: ${getFullImageUrl(
                      signatureDocument.path
                    )}</small>
                      </div>
                    `;
                  }
                }}
                onLoad={() => {
                  console.log(
                    "Signature image loaded successfully from:",
                    getFullImageUrl(signatureDocument.path)
                  );
                }}
              />
            </Box>

            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 3, justifyContent: "center" }}
            >
              {doctorId && onRedrawSignature && (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={handleRedraw}
                >
                  Redraw Signature
                </Button>
              )}
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center" }}
            >
              {signatureDocument.created_at && (
                <>
                  Uploaded:{" "}
                  {new Date(signatureDocument.created_at).toLocaleDateString()}
                  <br />
                </>
              )}
              {signatureDocument.file_name &&
                `File: ${signatureDocument.file_name}`}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
              color: "text.secondary",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              No signature found
            </Typography>
            <Typography>The signature document could not be loaded.</Typography>
            {signatureDocument && (
              <Typography variant="caption" sx={{ mt: 1 }}>
                Document exists but path is missing:{" "}
                {JSON.stringify(signatureDocument)}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ borderTop: "1px solid", borderColor: "divider" }}
      >
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureViewDialog;
