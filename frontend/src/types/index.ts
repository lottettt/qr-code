export type Role = 'Viewer' | 'Operator' | 'Administrator' | 'System Administrator'

export type EntityStatus = 'Active' | 'Inactive'

export type QrItemStatus = 'Draft' | 'Active' | 'Inactive' | 'Replaced' | 'Deprecated'

export type LocationField =
  | 'businessUnit'
  | 'factory'
  | 'building'
  | 'floor'
  | 'productionLine'
  | 'area'
  | 'process'
  | 'station'
  | 'machine'
  | 'position'
  | 'physicalLocation'
  | 'installationNote'

export type User = {
  id: string
  username: string
  displayName: string
  role: Role
  email?: string
}

export type System = {
  id: string
  name: string
  description: string
  systemOwner: string
  contact: string
  baseUrl?: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export type QrType = {
  id: string
  systemId: string
  typeName: string
  displayLabel: string
  description: string
  requiredFields: LocationField[]
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export type QrItem = {
  id: string
  qrTypeId: string
  systemId: string
  itemName: string
  qrValue: string
  description: string
  businessUnit?: string
  factory?: string
  building?: string
  floor?: string
  productionLine?: string
  area?: string
  process?: string
  station?: string
  machine?: string
  position?: string
  physicalLocation?: string
  installationNote?: string
  status: QrItemStatus
  replacedById?: string
  replacesId?: string
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type AuditAction =
  | 'system.created'
  | 'system.updated'
  | 'qr_type.created'
  | 'qr_type.updated'
  | 'qr_item.created'
  | 'qr_item.updated'
  | 'qr_item.activated'
  | 'qr_item.deactivated'
  | 'qr_item.replaced'
  | 'user.created'
  | 'user.updated'

export type AuditLog = {
  id: string
  userId: string
  userName: string
  action: AuditAction
  entityType: 'System' | 'QrType' | 'QrItem' | 'User'
  entityId: string
  oldValue?: string
  newValue?: string
  createdAt: string
}

export type QrItemInput = Omit<QrItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & {
  id?: string
}

export const LOCATION_FIELD_LABELS: Record<LocationField, string> = {
  businessUnit: 'Business Unit',
  factory: 'Factory',
  building: 'Building',
  floor: 'Floor',
  productionLine: 'Production Line',
  area: 'Area',
  process: 'Process',
  station: 'Station',
  machine: 'Machine / Equipment',
  position: 'Position',
  physicalLocation: 'Physical Location',
  installationNote: 'Installation Note'
}

export const ALL_LOCATION_FIELDS = Object.keys(LOCATION_FIELD_LABELS) as LocationField[]
