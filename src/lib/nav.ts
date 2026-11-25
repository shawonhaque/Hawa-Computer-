import { PERMISSIONS, type Permission } from "@/lib/permissions";

export const publicNav = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/applications", key: "applications" },
  { href: "/shop", key: "shop" },
  { href: "/library", key: "library" },
  { href: "/training", key: "training" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export const accountNav = [
  { href: "/account", key: "overview", icon: "LayoutDashboard" },
  { href: "/account/orders", key: "orders", icon: "ShoppingBag" },
  { href: "/account/applications", key: "applications", icon: "FileText" },
  { href: "/account/courses", key: "courses", icon: "GraduationCap" },
  { href: "/account/library", key: "library", icon: "BookOpen" },
  { href: "/account/files", key: "files", icon: "FolderOpen" },
  { href: "/account/invoices", key: "invoices", icon: "Receipt" },
  { href: "/account/tickets", key: "tickets", icon: "LifeBuoy" },
  { href: "/account/notifications", key: "notifications", icon: "Bell" },
  { href: "/account/profile", key: "profile", icon: "UserCog" },
] as const;

export type AdminNavItem = {
  href: string;
  key: string;
  icon: string;
  permission?: Permission;
};

export const adminNavGroups: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", key: "dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.DASHBOARD_VIEW }],
  },
  {
    label: "Work",
    items: [
      { href: "/admin/orders", key: "orders", icon: "ShoppingBag", permission: PERMISSIONS.ORDER_VIEW_ALL },
      { href: "/admin/service-orders", key: "serviceOrders", icon: "Wrench", permission: PERMISSIONS.ORDER_VIEW_ALL },
      { href: "/admin/applications", key: "applications", icon: "FileText", permission: PERMISSIONS.APPLICATION_VIEW_ALL },
      { href: "/admin/support", key: "support", icon: "LifeBuoy", permission: PERMISSIONS.SUPPORT_MANAGE },
      { href: "/admin/messages", key: "messages", icon: "Mail", permission: PERMISSIONS.SUPPORT_MANAGE },
    ],
  },
  {
    label: "Shop",
    items: [
      { href: "/admin/products", key: "products", icon: "Package", permission: PERMISSIONS.PRODUCT_MANAGE },
      { href: "/admin/inventory", key: "inventory", icon: "Boxes", permission: PERMISSIONS.INVENTORY_MANAGE },
      { href: "/admin/suppliers", key: "suppliers", icon: "Truck", permission: PERMISSIONS.SUPPLIER_MANAGE },
    ],
  },
  {
    label: "Library",
    items: [{ href: "/admin/library", key: "library", icon: "BookOpen", permission: PERMISSIONS.LIBRARY_MANAGE }],
  },
  {
    label: "Training",
    items: [
      { href: "/admin/courses", key: "courses", icon: "GraduationCap", permission: PERMISSIONS.COURSE_MANAGE },
      { href: "/admin/batches", key: "batches", icon: "CalendarRange", permission: PERMISSIONS.COURSE_MANAGE },
      { href: "/admin/students", key: "students", icon: "Users", permission: PERMISSIONS.ENROLLMENT_MANAGE },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/payments", key: "payments", icon: "CreditCard", permission: PERMISSIONS.PAYMENT_VERIFY },
      { href: "/admin/refunds", key: "refunds", icon: "Undo2", permission: PERMISSIONS.REFUND_MANAGE },
      { href: "/admin/finance", key: "finance", icon: "Wallet", permission: PERMISSIONS.FINANCE_VIEW },
      { href: "/admin/expenses", key: "expenses", icon: "ReceiptText", permission: PERMISSIONS.FINANCE_MANAGE },
      { href: "/admin/reports", key: "reports", icon: "BarChart3", permission: PERMISSIONS.REPORT_VIEW },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/customers", key: "customers", icon: "Contact", permission: PERMISSIONS.CUSTOMER_VIEW },
      { href: "/admin/staff", key: "staff", icon: "UserCog", permission: PERMISSIONS.USER_MANAGE },
      { href: "/admin/roles", key: "roles", icon: "ShieldCheck", permission: PERMISSIONS.ROLE_MANAGE },
      { href: "/admin/audit", key: "audit", icon: "ScrollText", permission: PERMISSIONS.AUDIT_VIEW },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/content", key: "content", icon: "LayoutTemplate", permission: PERMISSIONS.CMS_MANAGE },
      { href: "/admin/services", key: "services", icon: "Sparkles", permission: PERMISSIONS.CMS_MANAGE },
      { href: "/admin/settings", key: "settings", icon: "Settings", permission: PERMISSIONS.SETTINGS_MANAGE },
    ],
  },
];
