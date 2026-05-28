import React from "react";
import { Box, Typography } from "@mui/material";
import { useGetDocumentByIdQuery } from "../redux/api/document";

interface RenderResponseDataProps {
  documentId: any | undefined;
}

const RenderResponseData: React.FC<RenderResponseDataProps> = ({
  documentId,
}) => {
  // Skip query if no documentId
  const {
    data: image,
    isLoading,
    isError,
  } = useGetDocumentByIdQuery(documentId!, {
    skip: !documentId,
  });

  if (!documentId || isLoading) return <Typography>Loading...</Typography>;
  if (isError || !image) return <Typography>Error loading document</Typography>;

  return (
    <Box sx={{ mt: 1, p: 1, bgcolor: "grey.50", borderRadius: '4px' }}>
      <Box
        component="pre"
        sx={{
          fontSize: "0.75rem",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          m: 0,
        }}
      >
        <img
          src={`${import.meta.env.VITE_API_BASE_URL}${image.path}`}
          alt={image.name}
        />
      </Box>
    </Box>
  );
};

export default RenderResponseData;
