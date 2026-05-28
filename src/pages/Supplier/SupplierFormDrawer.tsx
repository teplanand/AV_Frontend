import React, { useEffect, useState } from "react";
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useCreateSupplierMutation, useUpdateSupplierMutation } from "../../redux/api/suppliers";
import { toast } from "react-toastify";

interface SupplierFormDrawerProps {
    open: boolean;
    onClose: () => void;
    selectedRow: any;
}

const SupplierFormDrawer: React.FC<SupplierFormDrawerProps> = ({ open, onClose, selectedRow }) => {
    const [formData, setFormData] = useState({
        supplier_code: "",
        supplier_name: "",
        supplier_address: "",
        supplier_type: "",
    });

    const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
    const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

    useEffect(() => {
        if (selectedRow) {
            setFormData({
                supplier_code: selectedRow.supplier_code || "",
                supplier_name: selectedRow.supplier_name || "",
                supplier_address: selectedRow.supplier_address || "",
                supplier_type: selectedRow.supplier_type || "",
            });
        } else {
            setFormData({
                supplier_code: "",
                supplier_name: "",
                supplier_address: "",
                supplier_type: "",
            });
        }
    }, [selectedRow, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedRow) {
                await updateSupplier({ id: selectedRow.id, data: formData }).unwrap();
                toast.success("Supplier updated successfully");
            } else {
                await createSupplier(formData).unwrap();
                toast.success("Supplier created successfully");
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || "Something went wrong");
        }
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: { xs: 300, sm: 400 }, p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">{selectedRow ? "Edit Supplier" : "Add Supplier"}</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box>
                            <TextField
                                fullWidth
                                label="Supplier Code"
                                name="supplier_code"
                                value={formData.supplier_code}
                                onChange={handleChange}
                                required
                            />
                        </Box>
                        <Box>
                            <TextField
                                fullWidth
                                label="Supplier Name"
                                name="supplier_name"
                                value={formData.supplier_name}
                                onChange={handleChange}
                                required
                            />
                        </Box>
                        <Box>
                            <TextField
                                fullWidth
                                label="Supplier Type"
                                name="supplier_type"
                                value={formData.supplier_type}
                                onChange={handleChange}
                            />
                        </Box>
                        <Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Supplier Address"
                                name="supplier_address"
                                value={formData.supplier_address}
                                onChange={handleChange}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <Button variant="outlined" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                            {isCreating || isUpdating ? "Saving..." : "Save"}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Drawer>
    );
};

export default SupplierFormDrawer;
