/**
 * Permission catalogue. Roles store a subset of these keys; the UI and every
 * server action check them independently of the role name so permissions stay
 * configurable.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  ORDER_VIEW_ALL: "order:view_all",
  ORDER_MANAGE: "order:manage",
  APPLICATION_VIEW_ALL: "application:view_all",
  APPLICATION_MANAGE: "application:manage",
  APPLICATION_DOCUMENTS: "application:documents",

  PRODUCT_MANAGE: "product:manage",
  INVENTORY_MANAGE: "inventory:manage",
  SUPPLIER_MANAGE: "supplier:manage",

  LIBRARY_MANAGE: "library:manage",

  COURSE_MANAGE: "course:manage",
  ENROLLMENT_MANAGE: "enrollment:manage",
  CERTIFICATE_ISSUE: "certificate:issue",
  ATTENDANCE_MANAGE: "attendance:manage",

  PAYMENT_VERIFY: "payment:verify",
  REFUND_MANAGE: "refund:manage",
  FINANCE_VIEW: "finance:view",
  FINANCE_MANAGE: "finance:manage",
  REPORT_VIEW: "report:view",

  CUSTOMER_VIEW: "customer:view",
  CUSTOMER_MANAGE: "customer:manage",

  USER_MANAGE: "user:manage",
  ROLE_MANAGE: "role:manage",
  AUDIT_VIEW: "audit:view",

  CMS_MANAGE: "cms:manage",
  SUPPORT_MANAGE: "support:manage",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Dashboard",
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    label: "Orders & applications",
    permissions: [
      PERMISSIONS.ORDER_VIEW_ALL,
      PERMISSIONS.ORDER_MANAGE,
      PERMISSIONS.APPLICATION_VIEW_ALL,
      PERMISSIONS.APPLICATION_MANAGE,
      PERMISSIONS.APPLICATION_DOCUMENTS,
    ],
  },
  {
    label: "Shop & inventory",
    permissions: [
      PERMISSIONS.PRODUCT_MANAGE,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.SUPPLIER_MANAGE,
    ],
  },
  {
    label: "Library",
    permissions: [PERMISSIONS.LIBRARY_MANAGE],
  },
  {
    label: "Training",
    permissions: [
      PERMISSIONS.COURSE_MANAGE,
      PERMISSIONS.ENROLLMENT_MANAGE,
      PERMISSIONS.ATTENDANCE_MANAGE,
      PERMISSIONS.CERTIFICATE_ISSUE,
    ],
  },
  {
    label: "Money",
    permissions: [
      PERMISSIONS.PAYMENT_VERIFY,
      PERMISSIONS.REFUND_MANAGE,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_MANAGE,
      PERMISSIONS.REPORT_VIEW,
    ],
  },
  {
    label: "People",
    permissions: [
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_MANAGE,
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.ROLE_MANAGE,
      PERMISSIONS.AUDIT_VIEW,
    ],
  },
  {
    label: "Website & support",
    permissions: [
      PERMISSIONS.CMS_MANAGE,
      PERMISSIONS.SUPPORT_MANAGE,
      PERMISSIONS.SETTINGS_MANAGE,
    ],
  },
];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  locale: string;
  role: { id: string; slug: string; name: string; isStaff: boolean; permissions: string[] };
};

export function can(user: Pick<SessionUser, "role"> | null | undefined, permission: Permission) {
  if (!user) return false;
  if (user.role.slug === "super-admin") return true;
  return user.role.permissions.includes(permission);
}

export function canAny(user: SessionUser | null | undefined, permissions: Permission[]) {
  return permissions.some((p) => can(user, p));
}
