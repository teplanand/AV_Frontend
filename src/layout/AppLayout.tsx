import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppProvider } from "@toolpad/core";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { navItems } from "../sidebarNavItems";
import { useGetMyPermissionsQuery } from "../redux/api/login";

import UserDropdown from "../components/header/UserDropdown";
import ThemeToggleButton from "../components/header/ThemeToggleButton";
import AppsIcon from "@mui/icons-material/Apps";
import {
    Box,
    IconButton,
    Badge,
    Popover,
    Checkbox,
    Typography,
    useTheme,
    Tooltip,
} from "@mui/material";
import { Navigation } from "@toolpad/core/AppProvider";
import Loader from "../components/Loader/loader";
import { useSidebarSubmenuScroll } from "./useSidebarSubmenuScroll";
import logo from "../assets/logo1.png";
import NotificationDropdown from "../components/header/NotificationDropdown";
import { getDecodedToken, getToken } from "../utils/auth";
import Breadcrumbs from "../components/common/Breadcrumbs";
import { givePermission } from "../utils/givePermission";

function CustomToolbar() {
    const navigate = useNavigate();
    // ... (rest of logic)

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2 }}>
            <Tooltip title="All Apps">
                <IconButton onClick={() => navigate("/apps")} color="inherit">
                    <AppsIcon />
                </IconButton>
            </Tooltip>
            <NotificationDropdown />
            <ThemeToggleButton />
            <UserDropdown />
        </Box>
    );
}

const AppLayout: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    useSidebarSubmenuScroll();

    // Extract base path for AppPortal routing (e.g., /app/advance-payment)
    const basePathMatch = location.pathname.match(/^(\/app\/[^/]+)/);
    const basePath = basePathMatch ? basePathMatch[1] : "";

    const router = React.useMemo(() => {
        let currentPath = location.pathname;
        if (basePath && currentPath.startsWith(basePath)) {
            currentPath = currentPath.substring(basePath.length) || "/";
        }

        return {
            pathname: currentPath,
            searchParams: new URLSearchParams(location.search),
            navigate: (path: string | URL) => {
                const strPath = String(path);
                const prefix = basePath || "";
                const newPath = strPath.startsWith("/") ? `${prefix}${strPath}` : `${prefix}/${strPath}`;
                navigate(newPath);
            },
        };
    }, [location, navigate, basePath]);

    const [isPermissionsUpdated, setIsPermissionsUpdated] = React.useState(true);
    // const {
    //     data: permissionsData,
    //     isLoading,
    //     isError,
    // } = useGetMyPermissionsQuery(undefined, {
    //     refetchOnMountOrArgChange: true,
    // });

    // React.useEffect(() => {
    //     if (permissionsData?.data) {
    //         console.log("Updating permissions from server...", permissionsData.data);
    //         localStorage.setItem("permissions", JSON.stringify(permissionsData.data));
    //         setIsPermissionsUpdated(true);
    //     }
    // }, [permissionsData]);

    // React.useEffect(() => {
    //     if (isError) {
    //         // If error occurs (e.g. no internet/auth fail), don't block forever
    //         setIsPermissionsUpdated(true);
    //     }
    // }, [isError]);

    // Compute navigation structure based on permissions
    const navigation = React.useMemo(() => {
        const filterNavItems = (items: any[]): any[] => {
            return items
                .filter((item) => {
                    if (item.module) {
                        if (!givePermission(item.module, "view")) {
                            return false;
                        }
                    }
                    return true;
                })
                .map((item) => {
                    const newItem = { ...item };
                    if (newItem.subItems) {
                        newItem.subItems = filterNavItems(newItem.subItems);
                    }
                    // If a parent has no visible children and no path, hide it (optional UI polish)
                    // But for now, let's just stick to the requested permission logic
                    return newItem;
                });
        };

        const filteredItems = filterNavItems(navItems);

        // Transform to Toolpad Navigation format
        const transformToNavigation = (items: any[]): Navigation => {
            return items.map((item) => ({
                kind: "page",
                title: item.name,
                segment: item.path?.replace("/", ""),
                icon: item.icon,
                children: item.subItems
                    ? transformToNavigation(item.subItems)
                    : undefined,
            }));
        };

        return transformToNavigation(filteredItems);
    }, [isPermissionsUpdated]);

    const token = getToken();

    // If logged in and waiting for permissions update
    if (token && !isPermissionsUpdated) {
        return <Loader />;
    }

    return (
        <AppProvider
            navigation={navigation}
            router={router}
            theme={theme}
            branding={{
                logo: <img src={logo} alt="eelcon Logo" className="h-10" />,
                title: "",
            }}
        >
            <DashboardLayout
                slots={{ toolbarActions: CustomToolbar }}
                sidebarExpandedWidth={260}
                defaultSidebarCollapsed={true}
            >
                <div className="p-4 w-full md:p-3">
                    <Breadcrumbs />
                    <Outlet />
                </div>
            </DashboardLayout>
        </AppProvider>
    );
};

export default AppLayout;
