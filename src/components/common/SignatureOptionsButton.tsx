// src/components/common/SignatureOptionsButton.tsx
import React, { useEffect, useState } from "react";
import {
  IconButton,
  Tooltip,
  Popover,
  Box,
  Button,
  Stack,
} from "@mui/material";
import {
  Create as SignatureIcon,
  Edit,
  Upload,
  Visibility,
} from "@mui/icons-material";
import { useGetDocumentByIdQuery } from "../../redux/api/document";

interface SignatureOptionsButtonProps {
  doctorId: number;
  doctorName: string;
  currentSignatureId?: number | null;
  onAddSignature: (doctorId: number) => void;
  onUploadSignature: (doctorId: number) => void;
  onViewSignature?: (
    signatureId: number,
    doctorId: number,
    doctorName: string
  ) => void;
  disabled?: boolean;
  size?: "small" | "medium";
}

const SignatureOptionsButton: React.FC<SignatureOptionsButtonProps> = ({
  doctorId,
  doctorName,
  currentSignatureId,
  onAddSignature,
  onUploadSignature,
  onViewSignature,
  disabled = false,
  size = "small",
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewSignature = () => {
    if (currentSignatureId && onViewSignature) {
      onViewSignature(currentSignatureId, doctorId, doctorName);
    }
    handleClose();
  };

  const open = Boolean(anchorEl);
  const hasSignature = !!currentSignatureId;

  return (
    <>
      <Tooltip title={hasSignature ? "Edit Signature" : "Add Signature"} arrow>
        <IconButton
          size={size}
          onClick={handleClick}
          disabled={disabled}
          sx={{
            color: hasSignature ? "success.main" : "secondary.main",
            backgroundColor: hasSignature ? "success.50" : "transparent",
            "&:hover": {
              backgroundColor: hasSignature
                ? "success.lighter"
                : "secondary.lighter",
            },
            border: hasSignature ? "1px solid" : "1px dashed",
            borderColor: hasSignature ? "success.light" : "secondary.light",
            marginRight: 0.5,
            position: "relative",
            height: size === "small" ? 28 : 36,
            width: size === "small" ? 28 : 36,
          }}
        >
          {hasSignature ? (
            <Box
              sx={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                backgroundColor: "success.main",
                borderRadius: "50%",
                border: "1px solid white",
              }}
            />
          ) : null}
          <SignatureIcon fontSize={size} />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            mt: 1,
            boxShadow: 3,
            borderRadius: '4px',
            minWidth: 180,
          },
        }}
      >
        <Box sx={{ p: 1.5 }}>
          {hasSignature ? (
            <>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={handleViewSignature}
                  fullWidth
                  size="small"
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    backgroundColor: "primary.main",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  }}
                >
                  View Signature
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    onAddSignature(doctorId);
                    handleClose();
                  }}
                  fullWidth
                  size="small"
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                  }}
                >
                  Redraw Signature
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => {
                    onUploadSignature(doctorId);
                    handleClose();
                  }}
                  fullWidth
                  size="small"
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                  }}
                >
                  Upload New Signature
                </Button>
              </Stack>
            </>
          ) : (
            <Stack spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => {
                  onAddSignature(doctorId);
                  handleClose();
                }}
                fullWidth
                size="small"
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                }}
              >
                Draw Signature
              </Button>

              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => {
                  onUploadSignature(doctorId);
                  handleClose();
                }}
                fullWidth
                size="small"
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                }}
              >
                Upload Signature Image
              </Button>
            </Stack>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default SignatureOptionsButton;
