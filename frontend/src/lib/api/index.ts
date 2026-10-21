import type {
  AuditAction,
  AuditLog,
  EntityStatus,
  LocationField,
  QrItem,
  QrItemStatus,
  QrType,
  Role,
  System,
  User
} from '@/types'
import { LOCATION_FIELD_LABELS } from '@/types'
import { delay, getStore, nextAuditId, nextQrId, updateStore } from '@/lib/mock/store'
import { now } from '@/lib/mock/seed'

/** When true, duplicate detection only warns; when false, it would hard-block (future). */
export const DUPLICATE_WARNING_ONLY = true

export type DuplicateMatch = {
  id: string
  itemName: string
  reason: string
}

export type ActivationValidation = {
  ok: boolean
  errors: string[]
}

function currentUser(): User {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('qr-code-center-auth')

      if (raw) return JSON.parse(raw) as User
    } catch {
      // ignore
    }
  }

  return { id: 'u-admin', username: 'admin', displayName: 'Admin User', role: 'Administrator' }
}

function writeAudit(
  action: AuditAction,
  entityType: AuditLog['entityType'],
  entityId: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  const user = currentUser()

  updateStore(store => {
    store.auditLogs.unshift({
      id: nextAuditId(store),
      userId: user.id,
      userName: user.displayName,
      action,
      entityType,
      entityId,
      oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : undefined,
      newValue: newValue !== undefined ? JSON.stringify(newValue) : undefined,
      createdAt: now()
    })
  })
}

// ---- Systems ----

export async function listSystems(opts?: { includeInactive?: boolean }): Promise<System[]> {
  await delay()
  const store = getStore()
  let list = [...store.systems]

  if (!opts?.includeInactive) {
    list = list.filter(s => s.status === 'Active')
  }

  return list.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSystem(id: string): Promise<System | undefined> {
  await delay()

  return getStore().systems.find(s => s.id === id)
}

export async function createSystem(
  input: Omit<System, 'id' | 'createdAt' | 'updatedAt'>
): Promise<System> {
  await delay()
  const ts = now()
  const system: System = {
    ...input,
    id: `sys-${Date.now()}`,
    createdAt: ts,
    updatedAt: ts
  }

  updateStore(store => {
    store.systems.push(system)
  })
  writeAudit('system.created', 'System', system.id, undefined, system)

  return system
}

export async function updateSystem(id: string, patch: Partial<System>): Promise<System> {
  await delay()
  let updated!: System
  let old!: System

  updateStore(store => {
    const idx = store.systems.findIndex(s => s.id === id)

    if (idx < 0) throw new Error('System not found')
    old = { ...store.systems[idx] }
    store.systems[idx] = { ...store.systems[idx], ...patch, id, updatedAt: now() }
    updated = store.systems[idx]
  })
  writeAudit('system.updated', 'System', id, old, updated)

  return updated
}

// ---- QR Types ----

export async function listQrTypes(opts?: { systemId?: string; includeInactive?: boolean }): Promise<QrType[]> {
  await delay()
  let list = [...getStore().qrTypes]

  if (opts?.systemId) list = list.filter(t => t.systemId === opts.systemId)
  if (!opts?.includeInactive) list = list.filter(t => t.status === 'Active')

  return list.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel))
}

export async function getQrType(id: string): Promise<QrType | undefined> {
  await delay()

  return getStore().qrTypes.find(t => t.id === id)
}

export async function createQrType(
  input: Omit<QrType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<QrType> {
  await delay()
  const ts = now()
  const qrType: QrType = {
    ...input,
    id: `type-${Date.now()}`,
    createdAt: ts,
    updatedAt: ts
  }

  updateStore(store => {
    store.qrTypes.push(qrType)
  })
  writeAudit('qr_type.created', 'QrType', qrType.id, undefined, qrType)

  return qrType
}

export async function updateQrType(id: string, patch: Partial<QrType>): Promise<QrType> {
  await delay()
  let updated!: QrType
  let old!: QrType

  updateStore(store => {
    const idx = store.qrTypes.findIndex(t => t.id === id)

    if (idx < 0) throw new Error('QR type not found')
    old = { ...store.qrTypes[idx] }
    store.qrTypes[idx] = { ...store.qrTypes[idx], ...patch, id, updatedAt: tsSafe() }
    updated = store.qrTypes[idx]
  })
  writeAudit('qr_type.updated', 'QrType', id, old, updated)

  return updated
}

function tsSafe() {
  return now()
}

// ---- QR Items ----

export async function listQrItems(opts?: {
  systemId?: string
  qrTypeId?: string
  status?: QrItemStatus | QrItemStatus[]
  search?: string
  includeInactive?: boolean
}): Promise<QrItem[]> {
  await delay()
  let list = [...getStore().qrItems]

  if (opts?.systemId) list = list.filter(i => i.systemId === opts.systemId)
  if (opts?.qrTypeId) list = list.filter(i => i.qrTypeId === opts.qrTypeId)

  if (opts?.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status]

    list = list.filter(i => statuses.includes(i.status))
  } else if (!opts?.includeInactive) {
    list = list.filter(i => i.status === 'Active')
  }

  if (opts?.search) {
    const q = opts.search.toLowerCase()

    list = list.filter(i => {
      const hay = [
        i.id,
        i.itemName,
        i.description,
        i.productionLine,
        i.station,
        i.machine,
        i.position,
        i.factory,
        i.area,
        i.process,
        i.physicalLocation
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return hay.includes(q)
    })
  }

  return list.sort((a, b) => a.itemName.localeCompare(b.itemName))
}

export async function getQrItem(id: string): Promise<QrItem | undefined> {
  await delay()

  return getStore().qrItems.find(i => i.id === id)
}

export function findDuplicates(
  input: Partial<QrItem> & { systemId: string; qrTypeId: string; itemName: string },
  excludeId?: string
): DuplicateMatch[] {
  const store = getStore()
  const matches: DuplicateMatch[] = []

  for (const item of store.qrItems) {
    if (excludeId && item.id === excludeId) continue
    if (item.status === 'Replaced' || item.status === 'Deprecated') continue

    if (item.systemId === input.systemId && item.qrTypeId === input.qrTypeId && item.itemName === input.itemName) {
      matches.push({ id: item.id, itemName: item.itemName, reason: 'Same system, type, and item name' })
    } else if (input.qrValue && item.qrValue === input.qrValue) {
      matches.push({ id: item.id, itemName: item.itemName, reason: 'Same QR value / URL' })
    } else if (
      item.systemId === input.systemId &&
      input.productionLine &&
      input.position &&
      item.productionLine === input.productionLine &&
      item.position === input.position
    ) {
      matches.push({ id: item.id, itemName: item.itemName, reason: 'Same system, line, and position' })
    }
  }

  return matches
}

export async function createQrItem(
  input: Omit<QrItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
): Promise<QrItem> {
  await delay()
  const user = currentUser()
  const ts = now()
  let item!: QrItem

  updateStore(store => {
    item = {
      ...input,
      id: nextQrId(store),
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: ts,
      updatedAt: ts
    }
    store.qrItems.push(item)
  })
  writeAudit('qr_item.created', 'QrItem', item.id, undefined, item)

  return item
}

export async function createQrItemsBatch(
  inputs: Omit<QrItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[]
): Promise<QrItem[]> {
  await delay(Math.min(800, 100 + inputs.length * 20))
  const user = currentUser()
  const ts = now()
  const created: QrItem[] = []

  updateStore(store => {
    for (const input of inputs) {
      const item: QrItem = {
        ...input,
        id: nextQrId(store),
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: ts,
        updatedAt: ts
      }

      store.qrItems.push(item)
      created.push(item)
      store.auditLogs.unshift({
        id: nextAuditId(store),
        userId: user.id,
        userName: user.displayName,
        action: 'qr_item.created',
        entityType: 'QrItem',
        entityId: item.id,
        newValue: JSON.stringify(item),
        createdAt: ts
      })
    }
  })

  return created
}

export type QrBatchUpsertInput = {
  action: 'create' | 'update'
  existingItemId?: string
  payload: Omit<QrItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
}

export async function upsertQrItemsBatch(
  rows: QrBatchUpsertInput[]
): Promise<{ created: QrItem[]; updated: QrItem[] }> {
  await delay(Math.min(800, 100 + rows.length * 20))
  const user = currentUser()
  const ts = now()
  const created: QrItem[] = []
  const updated: QrItem[] = []

  updateStore(store => {
    for (const row of rows) {
      if (row.action === 'update' && row.existingItemId) {
        const idx = store.qrItems.findIndex(i => i.id === row.existingItemId)

        if (idx < 0) {
          // Fallback to create if the keyed item disappeared
          const item: QrItem = {
            ...row.payload,
            id: nextQrId(store),
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: ts,
            updatedAt: ts
          }

          store.qrItems.push(item)
          created.push(item)
          store.auditLogs.unshift({
            id: nextAuditId(store),
            userId: user.id,
            userName: user.displayName,
            action: 'qr_item.created',
            entityType: 'QrItem',
            entityId: item.id,
            newValue: JSON.stringify(item),
            createdAt: ts
          })
          continue
        }

        const old = { ...store.qrItems[idx] }

        store.qrItems[idx] = {
          ...store.qrItems[idx],
          ...row.payload,
          id: old.id,
          createdBy: old.createdBy,
          createdAt: old.createdAt,
          updatedBy: user.id,
          updatedAt: ts,
          replacedById: old.replacedById,
          replacesId: old.replacesId
        }
        updated.push(store.qrItems[idx])
        store.auditLogs.unshift({
          id: nextAuditId(store),
          userId: user.id,
          userName: user.displayName,
          action: 'qr_item.updated',
          entityType: 'QrItem',
          entityId: old.id,
          oldValue: JSON.stringify(old),
          newValue: JSON.stringify(store.qrItems[idx]),
          createdAt: ts
        })
      } else {
        const item: QrItem = {
          ...row.payload,
          id: nextQrId(store),
          createdBy: user.id,
          updatedBy: user.id,
          createdAt: ts,
          updatedAt: ts
        }

        store.qrItems.push(item)
        created.push(item)
        store.auditLogs.unshift({
          id: nextAuditId(store),
          userId: user.id,
          userName: user.displayName,
          action: 'qr_item.created',
          entityType: 'QrItem',
          entityId: item.id,
          newValue: JSON.stringify(item),
          createdAt: ts
        })
      }
    }
  })

  return { created, updated }
}

export async function updateQrItem(id: string, patch: Partial<QrItem>): Promise<QrItem> {
  await delay()
  const user = currentUser()
  let updated!: QrItem
  let old!: QrItem

  updateStore(store => {
    const idx = store.qrItems.findIndex(i => i.id === id)

    if (idx < 0) throw new Error('QR item not found')
    old = { ...store.qrItems[idx] }
    store.qrItems[idx] = {
      ...store.qrItems[idx],
      ...patch,
      id,
      updatedBy: user.id,
      updatedAt: now()
    }
    updated = store.qrItems[idx]
  })
  writeAudit('qr_item.updated', 'QrItem', id, old, updated)

  return updated
}

export function validateForActivation(item: QrItem, qrType?: QrType): ActivationValidation {
  const errors: string[] = []
  const store = getStore()
  const type = qrType ?? store.qrTypes.find(t => t.id === item.qrTypeId)
  const system = store.systems.find(s => s.id === item.systemId)

  if (!item.qrValue?.trim()) {
    errors.push('QR value is empty')
  }

  if (!system) {
    errors.push('Related system does not exist')
  } else if (system.status !== 'Active') {
    errors.push('Related system is inactive')
  }

  if (!type) {
    errors.push('QR type does not exist')
  } else if (type.status !== 'Active') {
    errors.push('QR type is inactive')
  } else {
    for (const field of type.requiredFields) {
      const value = item[field as LocationField]

      if (!value?.trim()) {
        errors.push(`Required field missing: ${LOCATION_FIELD_LABELS[field]}`)
      }
    }
  }

  if (item.qrValue && looksLikeUrl(item.qrValue) && !isValidUrl(item.qrValue)) {
    errors.push('QR value is not a valid URL')
  }

  return { ok: errors.length === 0, errors }
}

export async function activateQrItem(id: string): Promise<QrItem> {
  await delay()
  const store = getStore()
  const item = store.qrItems.find(i => i.id === id)

  if (!item) throw new Error('QR item not found')

  const validation = validateForActivation(item)

  if (!validation.ok) {
    throw new Error(`Cannot activate: ${validation.errors.join('; ')}`)
  }

  const user = currentUser()
  let updated!: QrItem

  updateStore(s => {
    const idx = s.qrItems.findIndex(i => i.id === id)

    s.qrItems[idx] = { ...s.qrItems[idx], status: 'Active', updatedBy: user.id, updatedAt: now() }
    updated = s.qrItems[idx]
  })
  writeAudit('qr_item.activated', 'QrItem', id, item.status, 'Active')

  return updated
}

export async function deactivateQrItem(id: string): Promise<QrItem> {
  await delay()
  const user = currentUser()
  let updated!: QrItem
  let oldStatus: QrItemStatus = 'Active'

  updateStore(store => {
    const idx = store.qrItems.findIndex(i => i.id === id)

    if (idx < 0) throw new Error('QR item not found')
    oldStatus = store.qrItems[idx].status
    store.qrItems[idx] = { ...store.qrItems[idx], status: 'Inactive', updatedBy: user.id, updatedAt: now() }
    updated = store.qrItems[idx]
  })
  writeAudit('qr_item.deactivated', 'QrItem', id, oldStatus, 'Inactive')

  return updated
}

export async function replaceQrItem(
  oldId: string,
  input: Omit<QrItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'replacesId' | 'replacedById'>
): Promise<{ oldItem: QrItem; newItem: QrItem }> {
  await delay()
  const user = currentUser()
  const ts = now()
  let newItem!: QrItem
  let oldItem!: QrItem

  updateStore(store => {
    const idx = store.qrItems.findIndex(i => i.id === oldId)

    if (idx < 0) throw new Error('QR item not found')

    newItem = {
      ...input,
      id: nextQrId(store),
      replacesId: oldId,
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: ts,
      updatedAt: ts
    }
    store.qrItems.push(newItem)
    store.qrItems[idx] = {
      ...store.qrItems[idx],
      status: 'Replaced',
      replacedById: newItem.id,
      updatedBy: user.id,
      updatedAt: ts
    }
    oldItem = store.qrItems[idx]
  })
  writeAudit('qr_item.replaced', 'QrItem', oldId, oldItem, newItem)

  return { oldItem, newItem }
}

// ---- Users & Audit ----

export async function listUsers(): Promise<User[]> {
  await delay()

  return [...getStore().users]
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  await delay()
  let updated!: User
  let old!: User

  updateStore(store => {
    const idx = store.users.findIndex(u => u.id === id)

    if (idx < 0) throw new Error('User not found')
    old = { ...store.users[idx] }
    store.users[idx] = { ...store.users[idx], role }
    updated = store.users[idx]
  })
  writeAudit('user.updated', 'User', id, old, updated)

  return updated
}

export async function registerUser(input: {
  username: string
  displayName: string
  email?: string
}): Promise<User> {
  await delay()

  const username = input.username.trim().toLowerCase()
  const displayName = input.displayName.trim()

  if (!username) throw new Error('Username is required')
  if (!displayName) throw new Error('Display name is required')
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error('Username must be 3–32 characters (letters, numbers, . _ -)')
  }

  const store = getStore()
  const existing = store.users.find(u => u.username.toLowerCase() === username)

  if (existing) throw new Error('Username is already taken')

  const user: User = {
    id: `u-${Date.now()}`,
    username,
    displayName,
    email: input.email?.trim() || undefined,
    role: 'Viewer'
  }

  updateStore(s => {
    s.users.push(user)
    s.auditLogs.unshift({
      id: nextAuditId(s),
      userId: user.id,
      userName: user.displayName,
      action: 'user.created',
      entityType: 'User',
      entityId: user.id,
      newValue: JSON.stringify(user),
      createdAt: now()
    })
  })

  return user
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  await delay()

  return [...getStore().auditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getDemoUsers(): Promise<User[]> {
  await delay(50)

  return [...getStore().users]
}

// ---- helpers ----

export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.includes('://') || value.startsWith('www.')
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export type { EntityStatus }
