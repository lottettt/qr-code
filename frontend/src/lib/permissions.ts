import type { Role, User } from '@/types'

export type Permission =
  | 'qr.view'
  | 'qr.download'
  | 'qr.print'
  | 'admin.systems'
  | 'admin.qrTypes'
  | 'admin.qrItems'
  | 'admin.audit'
  | 'admin.users'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Viewer: ['qr.view', 'qr.download'],
  Operator: ['qr.view', 'qr.download', 'qr.print', 'admin.qrItems'],
  Administrator: [
    'qr.view',
    'qr.download',
    'qr.print',
    'admin.systems',
    'admin.qrTypes',
    'admin.qrItems',
    'admin.audit'
  ],
  'System Administrator': [
    'qr.view',
    'qr.download',
    'qr.print',
    'admin.systems',
    'admin.qrTypes',
    'admin.qrItems',
    'admin.audit',
    'admin.users'
  ]
}

export function can(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false

  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
}

export function canAny(user: User | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(p => can(user, p))
}

export function isAdmin(user: User | null | undefined): boolean {
  return canAny(user, ['admin.systems', 'admin.qrTypes', 'admin.qrItems'])
}
