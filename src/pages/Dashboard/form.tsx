import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Breadcrumbs,
    Link,
    SelectChangeEvent,
} from "@mui/material";
import { useNavigate } from "react-router";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useToast } from "../../hooks/useToast";

const CreateRequisition = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        requestType: "supplier",
        supplierName: "",
        poNo: "",
        poAmount: "",
        advanceAmount: "",
        reason: "",
        paymentMode: "neft",
        organization: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form Submitted:", formData);
        showToast("Requisition Created Successfully (Mock)", "success");
        navigate("/supplier-payment"); // Redirect back to dashboard
    };

    return (
        <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
            {/* Breadcrumbs */}
            <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ mb: 3 }}
            >
                <Link
                    underline="hover"
                    color="inherit"
                    onClick={() => navigate("/supplier-payment")}
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                    Dashboard
                </Link>
                <Typography color="text.primary">Create Requisition</Typography>
            </Breadcrumbs>

            <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
                <IconButtonBack onClick={() => navigate(-1)} />
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "Nunito" }}>
                    Create New Requisition
                </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <Card sx={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            <Box>
                                <FormControl fullWidth>
                                    <InputLabel>Request Type</InputLabel>
                                    <Select
                                        name="requestType"
                                        value={formData.requestType}
                                        label="Request Type"
                                        onChange={handleSelectChange}
                                    >
                                        <MenuItem value="supplier">Supplier Payment</MenuItem>
                                        <MenuItem value="internal">Internal Payment</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <FormControl fullWidth>
                                    <InputLabel>Organization</InputLabel>
                                    <Select
                                        name="organization"
                                        value={formData.organization}
                                        label="Organization"
                                        onChange={handleSelectChange}
                                    >
                                        <MenuItem value="org1">Organization 1</MenuItem>
                                        <MenuItem value="org2">Organization 2</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <TextField
                                    fullWidth
                                    label="Supplier Name"
                                    name="supplierName"
                                    value={formData.supplierName}
                                    onChange={handleChange}
                                    required={formData.requestType === "supplier"}
                                />
                            </Box>

                            <Box>
                                <TextField
                                    fullWidth
                                    label="PO Number"
                                    name="poNo"
                                    value={formData.poNo}
                                    onChange={handleChange}
                                />
                            </Box>

                            <Box>
                                <TextField
                                    fullWidth
                                    label="PO Amount"
                                    name="poAmount"
                                    type="number"
                                    value={formData.poAmount}
                                    onChange={handleChange}
                                    InputProps={{ startAdornment: "₹" }}
                                />
                            </Box>

                            <Box>
                                <TextField
                                    fullWidth
                                    label="Advance Amount Required"
                                    name="advanceAmount"
                                    type="number"
                                    value={formData.advanceAmount}
                                    onChange={handleChange}
                                    required
                                    InputProps={{ startAdornment: "₹" }}
                                />
                            </Box>

                            <Box>
                                <FormControl fullWidth>
                                    <InputLabel>Payment Mode</InputLabel>
                                    <Select
                                        name="paymentMode"
                                        value={formData.paymentMode}
                                        label="Payment Mode"
                                        onChange={handleSelectChange}
                                    >
                                        <MenuItem value="neft">NEFT / RTGS</MenuItem>
                                        <MenuItem value="cheque">Cheque</MenuItem>
                                        <MenuItem value="cash">Cash</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                                <TextField
                                    fullWidth
                                    label="Reason / Remarks"
                                    name="reason"
                                    multiline
                                    rows={4}
                                    value={formData.reason}
                                    onChange={handleChange}
                                />
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                mt: 4,
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 2,
                            }}
                        >
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<SaveIcon />}
                                sx={{
                                    backgroundColor: "#F37440",
                                    "&:hover": { backgroundColor: "#B84A1C" },
                                    color: "white",
                                    px: 4,
                                }}
                            >
                                Submit Request
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </form>
        </Box>
    );
};

const IconButtonBack = ({ onClick }: { onClick: () => void }) => (
    <Box
        onClick={onClick}
        sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            cursor: "pointer",
            backgroundColor: "#f3f4f6",
            "&:hover": { backgroundColor: "#e5e7eb" },
            transition: "all 0.2s",
        }}
    >
        <ArrowBackIcon sx={{ color: "#4b5563" }} />
    </Box>
);

export default CreateRequisition;
