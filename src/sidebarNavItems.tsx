import { ProductionQuantityLimits } from "@mui/icons-material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import type { Navigation } from "@toolpad/core/AppProvider";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    module?: string;
    subItems?: {
      name: string;
      path: string;
      pro?: boolean;
      new?: boolean;
      module?: string;
    }[];
  }[];
  roles: string[];
  module?: string;
};

export const navItems: NavItem[] = [
  {
    icon: <DashboardOutlinedIcon />,
    name: "Dashboard",
    roles: ["admin"],
    path: "/",
  },

  {
    icon: <CurrencyRupeeOutlinedIcon />,
    name: "Supplier Payment",
    roles: ["admin"],
    path: "/supplier-payment",
  },
  {
    icon: <CurrencyRupeeOutlinedIcon />,
    name: "Payment Voucher",
    roles: ["admin"],
    path: "/payment-voucher",
  },
  {
    icon: <LocalHospitalOutlinedIcon />,
    name: "Supplier",
    roles: ["admin"],
    path: "/supplier",
  },
  {
    icon: <ProductionQuantityLimits />,
    name: "PO",
    roles: ["admin"],
    path: "/po",
  },
  // {
  //   icon: <ChecklistRtlIcon />,
  //   name: "Workflow",
  //   roles: ["admin"],
  //   path: "/workflow",
  // },
];

export const NAVIGATION: Navigation = navItems.map((item) => ({
  kind: "page" as const,
  title: item.name,
  segment: item.path?.replace("/", ""),
  icon: item.icon,
  children: item.subItems?.map((sub) => ({
    kind: "page" as const,
    title: sub.name,
    segment: sub.path.replace("/", ""),
    children: sub.subItems?.map((nested) => ({
      kind: "page" as const,
      title: nested.name,
      segment: nested.path.replace("/", ""),
    })),
  })),
}));
