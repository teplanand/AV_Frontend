import React from "react";

interface PermissionGuardProps {
    module: string;
    right: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    module,
    right,
    children,
    fallback = null,
}) => {
    // Retrieve permissions from localStorage
    const permissionsStr = localStorage.getItem("permissions");
    let permissions: Record<string, string[]> = {};

    try {
        if (permissionsStr) {
            permissions = JSON.parse(permissionsStr);
        }
    } catch (error) {
        console.error("Failed to parse permissions", error);
    }

    // Check if user has the right
    // We check if the module exists in permissions and if the right is in the list
    if (permissions[module] && permissions[module].includes(right)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
