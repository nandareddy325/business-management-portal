// ============================================================
// modules/rbac/permissions.ts
// Role-Based Access Control — Permission Definitions
// ============================================================

export type UserRole = 'super_admin' | 'tenant_admin' | 'manager' | 'employee'

export type Permission =
  // Leads
  | 'leads:read:all'
  | 'leads:read:own'
  | 'leads:create'
  | 'leads:update:all'
  | 'leads:update:own'
  | 'leads:delete'
  // Billing
  | 'billing:read'
  | 'billing:create'
  | 'billing:update'
  // HR
  | 'hr:read'
  | 'hr:manage'
  // Attendance
  | 'attendance:read:all'
  | 'attendance:read:own'
  | 'attendance:manage'
  // Reports
  | 'reports:read'
  // Users
  | 'users:manage'
  // Settings
  | 'settings:manage'
  // Industries
  | 'industries:read'
  | 'industries:manage'
  // Super Admin
  | 'admin:tenants'
  | 'admin:revenue'
  | 'admin:system'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'leads:read:all', 'leads:create', 'leads:update:all', 'leads:delete',
    'billing:read', 'billing:create', 'billing:update',
    'hr:read', 'hr:manage',
    'attendance:read:all', 'attendance:manage',
    'reports:read',
    'users:manage',
    'settings:manage',
    'industries:read', 'industries:manage',
    'admin:tenants', 'admin:revenue', 'admin:system',
  ],

  tenant_admin: [
    'leads:read:all', 'leads:create', 'leads:update:all', 'leads:delete',
    'billing:read', 'billing:create', 'billing:update',
    'hr:read', 'hr:manage',
    'attendance:read:all', 'attendance:manage',
    'reports:read',
    'users:manage',
    'settings:manage',
    'industries:read',
  ],

  manager: [
    'leads:read:all', 'leads:create', 'leads:update:all', 'leads:delete',
    'hr:read',
    'attendance:read:all', 'attendance:manage',
    'reports:read',
    'industries:read',
  ],

  employee: [
    'leads:read:own', 'leads:create', 'leads:update:own',
    'attendance:read:own',
    'industries:read',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

export function getRoleLevel(role: UserRole): number {
  const levels: Record<UserRole, number> = {
    super_admin: 4,
    tenant_admin: 3,
    manager: 2,
    employee: 1,
  }
  return levels[role] ?? 0
}

export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}
