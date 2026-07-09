'use client'

import { useAuth } from '@/hooks/use-auth'
import { hasPermission, hasAnyPermission, type Permission, type UserRole } from './permissions'

type GuardProps = {
  permission?: Permission
  permissions?: Permission[]
  role?: UserRole
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({ permission, permissions, role, fallback = null, children }: GuardProps) {
  const { user, role: currentUserRole } = useAuth()
  if (!user) return <>{fallback}</>

  const userRole = currentUserRole as UserRole

  if (permission && !hasPermission(userRole, permission)) return <>{fallback}</>
  if (permissions && !hasAnyPermission(userRole, permissions)) return <>{fallback}</>
  if (role) {
    const hierarchy: Record<UserRole, number> = {
      super_admin: 4, tenant_admin: 3, manager: 2, employee: 1,
    }
    if (hierarchy[userRole] < hierarchy[role]) return <>{fallback}</>
  }

  return <>{children}</>
}
