import type { AuditLog, QrItem, QrType, System, User } from '@/types'
import { seedAuditLogs, seedQrItems, seedQrTypes, seedSystems, seedUsers } from './seed'

const STORAGE_KEY = 'qr-code-center-data'

export type StoreData = {
  systems: System[]
  qrTypes: QrType[]
  qrItems: QrItem[]
  users: User[]
  auditLogs: AuditLog[]
  nextQrSeq: number
  nextAuditSeq: number
}

function createInitialStore(): StoreData {
  return {
    systems: structuredClone(seedSystems),
    qrTypes: structuredClone(seedQrTypes),
    qrItems: structuredClone(seedQrItems),
    users: structuredClone(seedUsers),
    auditLogs: structuredClone(seedAuditLogs),
    nextQrSeq: 15,
    nextAuditSeq: 4
  }
}

let memoryStore: StoreData | null = null

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadStore(): StoreData {
  if (memoryStore) return memoryStore

  if (canUseStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)

      if (raw) {
        memoryStore = JSON.parse(raw) as StoreData

        return memoryStore
      }
    } catch {
      // fall through to seed
    }
  }

  memoryStore = createInitialStore()
  persistStore()

  return memoryStore
}

export function persistStore(): void {
  if (!memoryStore) return

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore))
  }
}

export function resetStore(): StoreData {
  memoryStore = createInitialStore()
  persistStore()

  return memoryStore
}

export function getStore(): StoreData {
  return loadStore()
}

export function updateStore(mutator: (store: StoreData) => void): StoreData {
  const store = loadStore()

  mutator(store)
  persistStore()

  return store
}

export function nextQrId(store: StoreData): string {
  const id = `QR-${String(store.nextQrSeq).padStart(6, '0')}`

  store.nextQrSeq += 1

  return id
}

export function nextAuditId(store: StoreData): string {
  const id = `aud-${String(store.nextAuditSeq).padStart(3, '0')}`

  store.nextAuditSeq += 1

  return id
}

export function delay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
