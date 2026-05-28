import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  CircularProgress,
  IconButton,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRef, useState, useEffect } from "react";
import { useUploadDocumentMutation } from "../redux/api/document";
import { useToast } from "../hooks/useToast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (documentId: number) => void;
}

const SignatureImageUploadDialog = ({ open, onClose, onSave }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(20);

  const { showToast } = useToast();
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();


  const processImage = async (src: string, th: number) => {
    const img = new Image();
    img.src = src;

    await new Promise((r) => (img.onload = r));

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const brightness = (r + g + b) / 3;

      // remove white-ish background
      if (brightness > 255 - th) {
        data[i + 3] = 0;
      } else {
        const x = (i / 4) % canvas.width;
        const y = Math.floor(i / 4 / canvas.width);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    ctx.putImageData(imageData, 0, 0);

    if (maxX <= minX || maxY <= minY) {
      setProcessedImage(null);
      return;
    }

    const padding = 6;
    minX = Math.max(minX - padding, 0);
    minY = Math.max(minY - padding, 0);
    maxX = Math.min(maxX + padding, canvas.width);
    maxY = Math.min(maxY + padding, canvas.height);

    const w = maxX - minX;
    const h = maxY - minY;

    const cropped = document.createElement("canvas");
    cropped.width = w;
    cropped.height = h;

    cropped
      .getContext("2d")!
      .drawImage(canvas, minX, minY, w, h, 0, 0, w, h);

    setProcessedImage(cropped.toDataURL("image/png"));
  };

  useEffect(() => {
    if (originalImage) {
      processImage(originalImage, threshold);
    }
  }, [originalImage]);


  useEffect(() => {
    if (originalImage) {
      processImage(originalImage, threshold);
    }
  }, [threshold]);


  const handleSave = async () => {
    if (!processedImage) {
      showToast("Signature not processed", "warning");
      return;
    }

    const blob = await (await fetch(processedImage)).blob();

    const formData = new FormData();
    formData.append("name", `signature_${Date.now()}.png`);
    formData.append("file", blob);
    formData.append("type", "digital_sign");

    const result = await uploadDocument(formData).unwrap();
    onSave(result.document_id);
    showToast("Signature saved successfully!", "success");
    handleClose();
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  };


  const handleClose = () => {
    // Clear images
    setOriginalImage(null);
    setProcessedImage(null);
    // Reset threshold to default
    setThreshold(20);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Call parent's onClose
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Upload Signature Image
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />

        <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
          Choose Image
        </Button>

        <Box mt={2}>
          <Typography fontWeight={600} mb={1}>
            Preview
          </Typography>

          <Grid container spacing={2}>
            {/* Original */}
            <Grid size={{ xs: 6 }}>
              <Typography fontSize={12} mb={0.5}>
                Original Image
              </Typography>
              <Box sx={{ border: "1px dashed #ccc", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {originalImage ? (
                  <img src={originalImage} className="max-w-full max-h-full object-contain" />
                ) : (
                  <Typography fontSize={12}>No image</Typography>
                )}
              </Box>
            </Grid>

            {/* Transparent */}
            <Grid size={{ xs: 6 }}>
              <Typography fontSize={12} mb={0.5}>
                Transparent Background
              </Typography>
              <Box sx={{ position: "relative", border: "1px dashed #ccc", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `
                      linear-gradient(45deg,#e0e0e0 25%,transparent 25%),
                      linear-gradient(-45deg,#e0e0e0 25%,transparent 25%),
                      linear-gradient(45deg,transparent 75%,#e0e0e0 75%),
                      linear-gradient(-45deg,transparent 75%,#e0e0e0 75%)
                    `,
                    backgroundSize: "16px 16px",
                  }}
                />
                {processedImage ? (
                  <img src={processedImage} className="max-w-full max-h-full object-contain z-[1]" />
                ) : (
                  <Typography fontSize={12} zIndex={1}>
                    Not processed
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box mt={2}>
          <Typography fontSize={13}>Threshold: {threshold}</Typography>
          <Slider value={threshold} min={5} max={60} step={1} onChange={(_, v) => setThreshold(v as number)} />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={handleSave} disabled={isLoading}>
          {isLoading ? <CircularProgress size={20} /> : "Save Signature"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureImageUploadDialog;