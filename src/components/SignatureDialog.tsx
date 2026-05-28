import CloseIcon from "@mui/icons-material/Close"; // Add this import
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  Typography,
} from "@mui/material";
import Signature from "@uiw/react-signature";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../hooks/useToast";
import {
  useGetDocumentByIdQuery,
  useUploadDocumentMutation,
} from "../redux/api/document";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (documentId: number) => void;
  initialDocumentId?: number | null;
}

export default function SignatureDialog({
  open,
  onClose,
  onSave,
  initialDocumentId = null,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(1);
  const [penColor, setPenColor] = useState("#000000");
  const [strokeSize, setStrokeSize] = useState(8);
  const [smoothing, setSmoothing] = useState(0.5);
  const [thinning, setThinning] = useState(0.5);
  const { showToast } = useToast();
  const [uploadDocument, { isLoading: isUploading }] =
    useUploadDocumentMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: existingDocument, isLoading: isFetching } =
    useGetDocumentByIdQuery(initialDocumentId as number, {
      skip: !initialDocumentId,
    });

  useEffect(() => {
    if (existingDocument?.path) {
      const base = import.meta.env.VITE_API_BASE_URL;
      const relative = existingDocument.path.startsWith("/")
        ? existingDocument.path
        : `/${existingDocument.path}`;
      setPreviewUrl(`${base}${relative}`);
    }
  }, [existingDocument]);

  useEffect(() => {
    if (!open && wrapperRef.current) {
      setPreviewUrl(null);
      const canvas = wrapperRef.current.querySelector("canvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [open]);

  const createCroppedSvg = (svg: SVGSVGElement) => {
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));

    if (paths.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    paths.forEach((path) => {
      const box = path.getBBox();
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    const padding = 6;

    const clonedSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    clonedSvg.setAttribute(
      "viewBox",
      `${minX - padding} ${minY - padding} 
     ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`
    );

    clonedSvg.setAttribute("width", `${maxX - minX + padding * 2}`);
    clonedSvg.setAttribute("height", `${maxY - minY + padding * 2}`);

    clonedSvg.style.background = "transparent";

    // 🔥 ONLY append signature paths (NO rect / NO guide)
    paths.forEach((p) => clonedSvg.appendChild(p.cloneNode(true)));

    return clonedSvg;
  };

  const croppedSvgToPngBlob = async (svg: SVGSVGElement): Promise<Blob> => {
    const croppedSvg = createCroppedSvg(svg);
    if (!croppedSvg) throw new Error("Empty signature");

    const vb = croppedSvg.viewBox.baseVal;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(croppedSvg);

    const img = new Image();
    img.src = URL.createObjectURL(
      new Blob([svgStr], { type: "image/svg+xml" })
    );

    await new Promise((r) => (img.onload = r));

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vb.width);
    canvas.height = Math.ceil(vb.height);

    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(img, 0, 0);

    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );
  };

  const handleSave = async () => {
    if (!wrapperRef.current) {
      showToast("Signature not found", "warning");
      return;
    }

    const svg = wrapperRef.current.querySelector<SVGSVGElement>("svg");
    if (!svg || svg.querySelectorAll("path").length === 0) {
      showToast("Please add signature", "warning");
      return;
    }

    try {
      const blob = await croppedSvgToPngBlob(svg);

      const formData = new FormData();
      formData.append("name", `signature_${Date.now()}.png`);
      formData.append("file", blob);
      formData.append("type", "digital_sign");

      const result = await uploadDocument(formData).unwrap();
      onSave(result.document_id);
      showToast("Signature saved successfully!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to save signature", "error");
    }
  };

  const getSignatureSvg = () => {
    if (!wrapperRef.current) return null;
    return wrapperRef.current.querySelector("svg");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6">Digital Signature</Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            marginLeft: "auto",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          {initialDocumentId
            ? "Draw new signature below:"
            : "Draw your signature:"}
        </Typography>

        <Box ref={wrapperRef}>
          <Signature
            options={{
              size: strokeSize,
              thinning: thinning,
              smoothing: smoothing,
              streamline: 0.5,
              simulatePressure: true,
            }}
            className="border-2 border-dashed border-[#ccc] w-full h-[200px] bg-transparent"
            style={{
              color: penColor,
            }}
            onPointer={(points) => {
              if (points && points.length > 0) {
                // Signature added
              }
            }}
          />
        </Box>

        <Box mt={2} display="flex" flexDirection="column" gap={2}>
          {/* Pen Color */}
          <Box>
            <Typography fontSize={14} gutterBottom>
              Pen Color
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <input
                type="color"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
                className="w-[50px] h-[40px] border border-[#ccc] rounded cursor-pointer"
              />
              <Typography fontSize={12} color="text.secondary">
                {penColor}
              </Typography>
            </Box>
          </Box>

          {/* Stroke Size */}
          <Box>
            <Typography fontSize={14} gutterBottom>
              Stroke Size: {strokeSize}px
            </Typography>
            <Slider
              value={strokeSize}
              min={1}
              max={20}
              step={1}
              onChange={(_, v) => setStrokeSize(v as number)}
            />
          </Box>

          {/* Smoothing */}
          <Box>
            <Typography fontSize={14} gutterBottom>
              Smoothing: {smoothing.toFixed(1)}
            </Typography>
            <Slider
              value={smoothing}
              min={0}
              max={1}
              step={0.1}
              onChange={(_, v) => setSmoothing(v as number)}
            />
          </Box>

          {/* Thinning */}
          <Box>
            <Typography fontSize={14} gutterBottom>
              Thinning: {thinning.toFixed(1)}
            </Typography>
            <Slider
              value={thinning}
              min={-1}
              max={1}
              step={0.1}
              onChange={(_, v) => setThinning(v as number)}
            />
          </Box>

          {/* Opacity */}
          <Box>
            <Typography fontSize={14} gutterBottom>
              Signature Visibility: {(opacity * 100).toFixed(0)}%
            </Typography>
            <Slider
              value={opacity}
              min={0.3}
              max={1}
              step={0.1}
              onChange={(_, v) => setOpacity(v as number)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button
          onClick={() => {
            const svg = getSignatureSvg();
            svg?.querySelectorAll("path").forEach((p) => p.remove());
          }}
          variant="outlined"
          color="secondary"
        >
          Clear
        </Button>

        <Button variant="contained" onClick={handleSave} disabled={isUploading}>
          {isUploading ? <CircularProgress size={20} /> : "Save Signature"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}