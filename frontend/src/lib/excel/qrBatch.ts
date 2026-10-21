import * as XLSX from 'xlsx'

import type { LocationField, QrItem, QrItemStatus, QrType, System } from '@/types'
import { ALL_LOCATION_FIELDS, LOCATION_FIELD_LABELS } from '@/types'
import { findDuplicates, isValidUrl, looksLikeUrl, validateForActivation } from '@/lib/api'

/** Excel header row for the QR Items sheet (order matters). */
export const QR_BATCH_HEADERS = [
  'System Name',
  'QR Type',
  'Item Name',
  'QR Value',
  'Description',
  'Status',
  ...ALL_LOCATION_FIELDS.map(f => LOCATION_FIELD_LABELS[f])
] as const

export type QrBatchRowRaw = Record<string, string>

export type QrBatchAction = 'create' | 'update'

export type QrBatchValidatedRow = {
  rowNumber: number
  raw: QrBatchRowRaw
  ok: boolean
  errors: string[]
  warnings: string[]
  action?: QrBatchAction
  existingItemId?: string
  payload?: Omit<QrItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
}

export type QrBatchParseResult = {
  formatErrors: string[]
  rows: QrBatchValidatedRow[]
}

/** Business key for upsert: System + QR Type + Item Name (case-insensitive). */
export function qrItemBusinessKey(systemId: string, qrTypeId: string, itemName: string): string {
  return `${systemId}::${qrTypeId}::${itemName.trim().toLowerCase()}`
}

export function findExistingByBusinessKey(
  items: QrItem[],
  systemId: string,
  qrTypeId: string,
  itemName: string
): QrItem | undefined {
  const key = qrItemBusinessKey(systemId, qrTypeId, itemName)

  return items.find(
    i =>
      i.status !== 'Replaced' &&
      i.status !== 'Deprecated' &&
      qrItemBusinessKey(i.systemId, i.qrTypeId, i.itemName) === key
  )
}

const HEADER_TO_FIELD: Record<string, string> = {
  'System Name': 'systemName',
  'QR Type': 'qrType',
  'Item Name': 'itemName',
  'QR Value': 'qrValue',
  Description: 'description',
  Status: 'status',
  ...Object.fromEntries(ALL_LOCATION_FIELDS.map(f => [LOCATION_FIELD_LABELS[f], f]))
}

function cellStr(value: unknown): string {
  if (value === null || value === undefined) return ''

  return String(value).trim()
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/\s+/g, ' ')
}

/** Build and download the Excel template (QR Items + Reference sheets). */
export function downloadQrBatchTemplate(systems: System[], qrTypes: QrType[]) {
  const wb = XLSX.utils.book_new()

  const sampleRows = [
    QR_BATCH_HEADERS as unknown as string[],
    [
      'e-WSL',
      'Position',
      'Position 99',
      'https://ewsl.factory.local/position/99',
      'Sample row — replace or delete',
      'Draft',
      '',
      'Factory A',
      '',
      '',
      'Line 2',
      '',
      '',
      '',
      '',
      'Operator Monitor',
      '',
      ''
    ]
  ]

  const itemsSheet = XLSX.utils.aoa_to_sheet(sampleRows)
  itemsSheet['!cols'] = QR_BATCH_HEADERS.map(h => ({ wch: Math.max(14, h.length + 2) }))
  XLSX.utils.book_append_sheet(wb, itemsSheet, 'QR Items')

  const instructions = [
    ['QR Code Center — Batch Import Template'],
    [''],
    ['Instructions'],
    ['1. Fill rows on the "QR Items" sheet. Do not rename column headers.'],
    ['2. System Name must match an existing system exactly (see Reference sheet).'],
    ['3. QR Type must match Type Name or Display Label for that system.'],
    ['4. KEY columns: System Name + QR Type + Item Name. Same key updates/replaces the existing QR item (no duplicate append).'],
    ['5. Status: Draft (default), Active, or Inactive. Active rows must pass activation rules.'],
    ['6. Required location fields depend on the QR Type (see Reference).'],
    ['7. Delete the sample row before uploading.'],
    [''],
    ['Required columns'],
    ['System Name, QR Type, Item Name, QR Value'],
    [''],
    ['Upsert key'],
    ['System Name + QR Type + Item Name']
  ]

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), 'Instructions')

  const refHeader = ['System Name', 'System Status', 'QR Type Name', 'Display Label', 'Type Status', 'Required Fields']
  const refRows: string[][] = [refHeader]

  const activeSystems = [...systems].sort((a, b) => a.name.localeCompare(b.name))

  for (const sys of activeSystems) {
    const types = qrTypes.filter(t => t.systemId === sys.id).sort((a, b) => a.typeName.localeCompare(b.typeName))

    if (types.length === 0) {
      refRows.push([sys.name, sys.status, '', '', '', ''])
      continue
    }

    for (const t of types) {
      refRows.push([
        sys.name,
        sys.status,
        t.typeName,
        t.displayLabel,
        t.status,
        t.requiredFields.map(f => LOCATION_FIELD_LABELS[f]).join(', ')
      ])
    }
  }

  const refSheet = XLSX.utils.aoa_to_sheet(refRows)
  refSheet['!cols'] = refHeader.map(h => ({ wch: Math.max(14, h.length + 2) }))
  XLSX.utils.book_append_sheet(wb, refSheet, 'Reference')

  XLSX.writeFile(wb, 'qr-batch-import-template.xlsx')
}

function sheetToObjects(sheet: XLSX.WorkSheet): { formatErrors: string[]; rows: QrBatchRowRaw[]; startRow: number } {
  const formatErrors: string[] = []
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })

  if (data.length === 0) {
    return { formatErrors: ['The "QR Items" sheet has no data rows.'], rows: [], startRow: 2 }
  }

  const first = data[0]
  const headers = Object.keys(first).map(normalizeHeader)
  const missing = QR_BATCH_HEADERS.filter(h => !headers.includes(h))

  if (missing.length > 0) {
    formatErrors.push(`Missing required column(s): ${missing.join(', ')}`)
  }

  const unknown = headers.filter(h => h && !HEADER_TO_FIELD[h] && !QR_BATCH_HEADERS.includes(h as (typeof QR_BATCH_HEADERS)[number]))

  if (unknown.length > 0) {
    formatErrors.push(`Unknown column(s): ${unknown.join(', ')}. Use the downloaded template headers.`)
  }

  if (formatErrors.length > 0) {
    return { formatErrors, rows: [], startRow: 2 }
  }

  const rows: QrBatchRowRaw[] = data.map(row => {
    const out: QrBatchRowRaw = {}

    for (const [key, value] of Object.entries(row)) {
      const header = normalizeHeader(key)
      const field = HEADER_TO_FIELD[header]

      if (field) out[field] = cellStr(value)
    }

    return out
  })

  return { formatErrors: [], rows, startRow: 2 }
}

function resolveSystem(name: string, systems: System[]): System | undefined {
  const q = name.trim().toLowerCase()

  return systems.find(s => s.name.trim().toLowerCase() === q)
}

function resolveQrType(label: string, systemId: string, qrTypes: QrType[]): QrType | undefined {
  const q = label.trim().toLowerCase()

  return qrTypes.find(
    t =>
      t.systemId === systemId &&
      (t.typeName.trim().toLowerCase() === q || t.displayLabel.trim().toLowerCase() === q)
  )
}

function parseStatus(raw: string): QrItemStatus | null {
  if (!raw) return 'Draft'
  const allowed: QrItemStatus[] = ['Draft', 'Active', 'Inactive']
  const match = allowed.find(s => s.toLowerCase() === raw.toLowerCase())

  return match ?? null
}

export function parseAndValidateQrBatch(
  fileBuffer: ArrayBuffer,
  systems: System[],
  qrTypes: QrType[],
  existingItems: QrItem[]
): QrBatchParseResult {
  const wb = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = wb.SheetNames.find(n => n.toLowerCase() === 'qr items') ?? wb.SheetNames[0]

  if (!sheetName) {
    return { formatErrors: ['Excel file has no sheets.'], rows: [] }
  }

  const sheet = wb.Sheets[sheetName]
  const { formatErrors, rows: rawRows, startRow } = sheetToObjects(sheet)

  if (formatErrors.length > 0) {
    return { formatErrors, rows: [] }
  }

  const validated: QrBatchValidatedRow[] = []
  const keysInFile = new Map<string, number>()

  rawRows.forEach((raw, index) => {
    const rowNumber = startRow + index
    const isEmpty = !raw.systemName && !raw.qrType && !raw.itemName && !raw.qrValue

    if (isEmpty) return

    const errors: string[] = []
    const warnings: string[] = []
    let action: QrBatchAction | undefined
    let existingItemId: string | undefined

    if (!raw.systemName) errors.push('System Name is required')
    if (!raw.qrType) errors.push('QR Type is required')
    if (!raw.itemName) errors.push('Item Name is required')
    if (!raw.qrValue) errors.push('QR Value is required')

    const system = raw.systemName ? resolveSystem(raw.systemName, systems) : undefined

    if (raw.systemName && !system) {
      errors.push(`System "${raw.systemName}" does not exist`)
    } else if (system && system.status !== 'Active') {
      errors.push(`System "${system.name}" is inactive`)
    }

    let qrType: QrType | undefined

    if (system && raw.qrType) {
      qrType = resolveQrType(raw.qrType, system.id, qrTypes)

      if (!qrType) {
        errors.push(`QR Type "${raw.qrType}" does not exist under system "${system.name}"`)
      } else if (qrType.status !== 'Active') {
        errors.push(`QR Type "${qrType.displayLabel}" is inactive`)
      }
    }

    const status = parseStatus(raw.status ?? '')

    if (status === null) {
      errors.push(`Invalid Status "${raw.status}". Use Draft, Active, or Inactive`)
    }

    if (raw.qrValue && looksLikeUrl(raw.qrValue) && !isValidUrl(raw.qrValue)) {
      errors.push('QR Value is not a valid URL')
    }

    if (qrType) {
      for (const field of qrType.requiredFields) {
        const val = raw[field]

        if (!val?.trim()) {
          errors.push(`Required field missing for this QR type: ${LOCATION_FIELD_LABELS[field as LocationField]}`)
        }
      }
    }

    let payload: QrBatchValidatedRow['payload']

    if (system && qrType && status && raw.itemName && errors.length === 0) {
      const key = qrItemBusinessKey(system.id, qrType.id, raw.itemName)
      const priorRow = keysInFile.get(key)

      if (priorRow !== undefined) {
        errors.push(
          `Duplicate key in this file (System + QR Type + Item Name). Same as row ${priorRow}. Only one row per key is allowed.`
        )
      } else {
        keysInFile.set(key, rowNumber)
      }

      const existing = findExistingByBusinessKey(existingItems, system.id, qrType.id, raw.itemName)

      if (existing) {
        action = 'update'
        existingItemId = existing.id
      } else {
        action = 'create'
      }
    }

    if (system && qrType && status && errors.length === 0) {
      const built = {
        systemId: system.id,
        qrTypeId: qrType.id,
        itemName: raw.itemName,
        qrValue: raw.qrValue,
        description: raw.description ?? '',
        status: (status === 'Active' ? 'Draft' : status) as typeof status,
        businessUnit: raw.businessUnit || undefined,
        factory: raw.factory || undefined,
        building: raw.building || undefined,
        floor: raw.floor || undefined,
        productionLine: raw.productionLine || undefined,
        area: raw.area || undefined,
        process: raw.process || undefined,
        station: raw.station || undefined,
        machine: raw.machine || undefined,
        position: raw.position || undefined,
        physicalLocation: raw.physicalLocation || undefined,
        installationNote: raw.installationNote || undefined
      }

      // Warn if QR value collides with a *different* item (not the one we will update)
      const valueClash = findDuplicates({
        systemId: built.systemId,
        qrTypeId: built.qrTypeId,
        itemName: built.itemName,
        qrValue: built.qrValue,
        productionLine: built.productionLine,
        position: built.position
      }).filter(d => d.id !== existingItemId && d.reason === 'Same QR value / URL')

      if (valueClash.length > 0) {
        warnings.push(`QR value already used by ${valueClash.map(d => d.id).join(', ')}`)
      }

      if (status === 'Active') {
        const activation = validateForActivation(
          {
            ...built,
            id: existingItemId ?? 'TEMP',
            createdBy: '',
            createdAt: '',
            updatedBy: '',
            updatedAt: ''
          },
          qrType
        )

        if (!activation.ok) {
          errors.push(`Cannot import as Active: ${activation.errors.join('; ')}`)
        } else {
          payload = { ...built, status: 'Active' }
        }
      } else {
        payload = built
      }
    }

    if (action === 'update' && existingItemId && payload && errors.length === 0) {
      warnings.push(`Will update existing item ${existingItemId}`)
    }

    validated.push({
      rowNumber,
      raw,
      ok: errors.length === 0 && !!payload,
      errors,
      warnings,
      action: errors.length === 0 && payload ? action : undefined,
      existingItemId,
      payload
    })
  })

  if (validated.length === 0 && formatErrors.length === 0) {
    return { formatErrors: ['No data rows found on the "QR Items" sheet.'], rows: [] }
  }

  return { formatErrors: [], rows: validated }
}
