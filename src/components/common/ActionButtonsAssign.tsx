import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";

interface ActionButtonsProps {
  onAssign: () => void;
  disabled?: boolean;
  size?: "small" | "medium";
  assignTooltip?: string;
}

const ActionButtonsAssign: React.FC<ActionButtonsProps> = ({
  onAssign,
  disabled = false,
  size = "small",
  assignTooltip = "Assign Rights",
}) => {
  return (
    <Tooltip title={assignTooltip}>
      <IconButton
        onClick={onAssign}
        color="info"
        size={size}
        disabled={disabled}
        sx={{
          color: "#0288d1",
          "&:hover": {
            color: "#0277bd",
            backgroundColor: "rgba(2, 136, 209, 0.08)",
          },
          "&.Mui-disabled": {
            color: "grey.400",
          },
          transition: "all 0.2s",
          padding: "4px",
          "& .MuiSvgIcon-root": {
            fontSize: "18px",
          },
        }}
      >
        <AssignmentOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export default ActionButtonsAssign;
