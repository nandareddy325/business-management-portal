import { redirect } from 'next/navigation'
import { authService } from '@/modules/auth/service'
import { subscriptionService } from '@/modules/subscription/service'
import { hasPermission, hasAnyPermission, type Permission, type UserRole } from './permissions'

// ── Server-side Route Guard ────────────────────────────────
export async function requireAuth() {
  const user = await authService.getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(minimumRole: UserRole) {
  const user = await requireAuth()
  const roleHierarchy: Record<UserRole, number> = {
    super_admin: 4, tenant_admin: 3, manager: 2, employee: 1,
  }
  if (roleHierarchy[user.role as UserRole] < roleHierarchy[minimumRole]) {
    redirect('/dashboard')
  }
  return user
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth()
  if (!hasPermission(user.role as UserRole, permission)) {
    redirect('/dashboard?error=unauthorized')
  }
  return user
}

export async function requireSuperAdmin() {
  const user = await requireAuth()
  if (user.role !== 'super_admin') redirect('/dashboard')
  return user
}

export async function requireIndustryAccess(industrySlug: string) {
  const user = await requireAuth()
  if (!user.industryAccess.includes(industrySlug)) {
    redirect('/dashboard/upgrade?industry=' + industrySlug)
  }
  return user
}

// ── Plan Feature Guard ──────────────────────────────────────
export async function requireFeature(feature: 'hrms' | 'billing' | 'realtime' | 'api' | 'branding') {
  const user = await requireAuth()
  const allowed = await subscriptionService.hasFeature(user.companyId, feature)
  if (!allowed) {
    redirect('/dashboard/upgrade?feature=' + feature)
  }
  return user
}

// ── Permission / Feature Check Helpers (no redirect) ────────
export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await authService.getCurrentUser()
  if (!user) return false
  return hasPermission(user.role as UserRole, permission)
}

export async function checkAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await authService.getCurrentUser()
  if (!user) return false
  return hasAnyPermission(user.role as UserRole, permissions)
}

export async function checkFeature(feature: 'hrms' | 'billing' | 'realtime' | 'api' | 'branding'): Promise<boolean> {
  const user = await authService.getCurrentUser()
  if (!user) return false
  return subscriptionService.hasFeature(user.companyId, feature)
}

// ── React component guard (client) ────────────────────────
// Moved to './permission-guard' (client component) to keep this module
// server-only. Import PermissionGuard from '@/modules/rbac/permission-guard'.