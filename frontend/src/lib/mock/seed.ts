import type { AuditLog, QrItem, QrType, System, User } from '@/types'

const now = () => new Date().toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString()

export const seedUsers: User[] = [
  { id: 'u-viewer', username: 'viewer', displayName: 'View User', role: 'Viewer', email: 'viewer@factory.local' },
  { id: 'u-operator', username: 'operator', displayName: 'Ops User', role: 'Operator', email: 'operator@factory.local' },
  { id: 'u-admin', username: 'admin', displayName: 'Admin User', role: 'Administrator', email: 'admin@factory.local' },
  {
    id: 'u-sysadmin',
    username: 'sysadmin',
    displayName: 'System Admin',
    role: 'System Administrator',
    email: 'sysadmin@factory.local'
  }
]

export const seedSystems: System[] = [
  {
    id: 'sys-ewsl',
    name: 'e-WSL',
    description: 'Electronic Work Standard List system',
    systemOwner: 'Production IT',
    contact: 'prod-it@factory.local',
    baseUrl: 'https://ewsl.factory.local',
    status: 'Active',
    createdAt: daysAgo(90),
    updatedAt: daysAgo(5)
  },
  {
    id: 'sys-matrack',
    name: 'Matrack',
    description: 'Material tracking system',
    systemOwner: 'Logistics',
    contact: 'logistics@factory.local',
    baseUrl: 'https://matrack.factory.local',
    status: 'Active',
    createdAt: daysAgo(80),
    updatedAt: daysAgo(10)
  },
  {
    id: 'sys-maint',
    name: 'Maintenance System',
    description: 'Equipment maintenance and PM checklists',
    systemOwner: 'Maintenance',
    contact: 'maint@factory.local',
    baseUrl: 'https://maint.factory.local',
    status: 'Active',
    createdAt: daysAgo(70),
    updatedAt: daysAgo(3)
  },
  {
    id: 'sys-prodmon',
    name: 'Production Monitoring',
    description: 'Live production dashboards and station monitors',
    systemOwner: 'Manufacturing Eng',
    contact: 'mfg@factory.local',
    baseUrl: 'https://prodmon.factory.local',
    status: 'Active',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2)
  },
  {
    id: 'sys-quality',
    name: 'Quality System',
    description: 'Quality inspection and defect tracking',
    systemOwner: 'Quality Assurance',
    contact: 'qa@factory.local',
    baseUrl: 'https://quality.factory.local',
    status: 'Active',
    createdAt: daysAgo(50),
    updatedAt: daysAgo(1)
  },
  {
    id: 'sys-legacy',
    name: 'Legacy WMS',
    description: 'Deprecated warehouse system (inactive)',
    systemOwner: 'Logistics',
    contact: 'logistics@factory.local',
    status: 'Inactive',
    createdAt: daysAgo(200),
    updatedAt: daysAgo(30)
  }
]

export const seedQrTypes: QrType[] = [
  {
    id: 'type-ewsl-pos',
    systemId: 'sys-ewsl',
    typeName: 'Production Position',
    displayLabel: 'Position',
    description: 'Operator positions on the line',
    requiredFields: ['productionLine', 'position'],
    status: 'Active',
    createdAt: daysAgo(85),
    updatedAt: daysAgo(85)
  },
  {
    id: 'type-ewsl-station',
    systemId: 'sys-ewsl',
    typeName: 'Station',
    displayLabel: 'Station',
    description: 'Work stations',
    requiredFields: ['productionLine', 'station'],
    status: 'Active',
    createdAt: daysAgo(85),
    updatedAt: daysAgo(85)
  },
  {
    id: 'type-ewsl-wi',
    systemId: 'sys-ewsl',
    typeName: 'Work Instruction',
    displayLabel: 'Work Instruction',
    description: 'WI documents',
    requiredFields: ['process'],
    status: 'Active',
    createdAt: daysAgo(85),
    updatedAt: daysAgo(85)
  },
  {
    id: 'type-matrack-dash',
    systemId: 'sys-matrack',
    typeName: 'Dashboard',
    displayLabel: 'Dashboard',
    description: 'Material dashboards',
    requiredFields: ['area'],
    status: 'Active',
    createdAt: daysAgo(75),
    updatedAt: daysAgo(75)
  },
  {
    id: 'type-maint-repair',
    systemId: 'sys-maint',
    typeName: 'Repair Request',
    displayLabel: 'Repair Request',
    description: 'Equipment repair request entry',
    requiredFields: ['machine'],
    status: 'Active',
    createdAt: daysAgo(65),
    updatedAt: daysAgo(65)
  },
  {
    id: 'type-maint-hist',
    systemId: 'sys-maint',
    typeName: 'Equipment History',
    displayLabel: 'Equipment',
    description: 'Equipment history view',
    requiredFields: ['machine'],
    status: 'Active',
    createdAt: daysAgo(65),
    updatedAt: daysAgo(65)
  },
  {
    id: 'type-maint-pm',
    systemId: 'sys-maint',
    typeName: 'PM Checklist',
    displayLabel: 'PM Checklist',
    description: 'Preventive maintenance checklist',
    requiredFields: ['machine'],
    status: 'Active',
    createdAt: daysAgo(65),
    updatedAt: daysAgo(65)
  },
  {
    id: 'type-prodmon-dash',
    systemId: 'sys-prodmon',
    typeName: 'Dashboard',
    displayLabel: 'Dashboard',
    description: 'Production monitoring dashboards',
    requiredFields: ['productionLine'],
    status: 'Active',
    createdAt: daysAgo(55),
    updatedAt: daysAgo(55)
  },
  {
    id: 'type-quality-insp',
    systemId: 'sys-quality',
    typeName: 'Inspection Point',
    displayLabel: 'Inspection',
    description: 'Quality inspection points',
    requiredFields: ['productionLine', 'station'],
    status: 'Active',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45)
  }
]

export const seedQrItems: QrItem[] = [
  {
    id: 'QR-000001',
    qrTypeId: 'type-ewsl-pos',
    systemId: 'sys-ewsl',
    itemName: 'Position 1',
    qrValue: 'https://ewsl.factory.local/position/1',
    description: 'Operator monitor - left side',
    factory: 'Factory A',
    productionLine: 'Line 2',
    station: 'ST-05',
    position: 'Operator Monitor - Left Side',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(40),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(5)
  },
  {
    id: 'QR-000002',
    qrTypeId: 'type-ewsl-pos',
    systemId: 'sys-ewsl',
    itemName: 'Position 2',
    qrValue: 'https://ewsl.factory.local/position/2',
    description: 'Operator monitor - right side',
    factory: 'Factory A',
    productionLine: 'Line 2',
    station: 'ST-05',
    position: 'Operator Monitor - Right Side',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(40),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(5)
  },
  {
    id: 'QR-000003',
    qrTypeId: 'type-ewsl-pos',
    systemId: 'sys-ewsl',
    itemName: 'Position 3',
    qrValue: 'https://ewsl.factory.local/position/3',
    description: 'Line 3 start position',
    factory: 'Factory A',
    productionLine: 'Line 3',
    station: 'ST-01',
    position: 'Start Position',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(38),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(4)
  },
  {
    id: 'QR-000004',
    qrTypeId: 'type-ewsl-station',
    systemId: 'sys-ewsl',
    itemName: 'ST-05 Assembly',
    qrValue: 'https://ewsl.factory.local/station/ST-05',
    description: 'Assembly station 05',
    factory: 'Factory A',
    productionLine: 'Line 2',
    station: 'ST-05',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(37),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(4)
  },
  {
    id: 'QR-000005',
    qrTypeId: 'type-ewsl-wi',
    systemId: 'sys-ewsl',
    itemName: 'WI-ASSY-001',
    qrValue: 'https://ewsl.factory.local/wi/ASSY-001',
    description: 'Assembly work instruction',
    process: 'Assembly',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(36),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(3)
  },
  {
    id: 'QR-000006',
    qrTypeId: 'type-matrack-dash',
    systemId: 'sys-matrack',
    itemName: 'Warehouse A Dashboard',
    qrValue: 'https://matrack.factory.local/dashboard/wh-a',
    description: 'Main warehouse dashboard',
    area: 'Warehouse A',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(30),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(2)
  },
  {
    id: 'QR-000007',
    qrTypeId: 'type-maint-repair',
    systemId: 'sys-maint',
    itemName: 'CNC-01 Repair',
    qrValue: 'https://maint.factory.local/repair/CNC-01',
    description: 'Repair request for CNC machine 01',
    machine: 'CNC-01',
    factory: 'Factory A',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(28),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(2)
  },
  {
    id: 'QR-000008',
    qrTypeId: 'type-maint-hist',
    systemId: 'sys-maint',
    itemName: 'CNC-01 History',
    qrValue: 'https://maint.factory.local/history/CNC-01',
    description: 'Equipment history for CNC-01',
    machine: 'CNC-01',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(27),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(1)
  },
  {
    id: 'QR-000009',
    qrTypeId: 'type-maint-pm',
    systemId: 'sys-maint',
    itemName: 'CNC-01 PM Checklist',
    qrValue: 'https://maint.factory.local/pm/CNC-01',
    description: 'PM checklist for CNC-01',
    machine: 'CNC-01',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(26),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(1)
  },
  {
    id: 'QR-000010',
    qrTypeId: 'type-prodmon-dash',
    systemId: 'sys-prodmon',
    itemName: 'Line 2 Live Monitor',
    qrValue: 'https://prodmon.factory.local/line/2',
    description: 'Live production monitor for Line 2',
    productionLine: 'Line 2',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(20),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(1)
  },
  {
    id: 'QR-000011',
    qrTypeId: 'type-quality-insp',
    systemId: 'sys-quality',
    itemName: 'Final Inspection L2',
    qrValue: 'https://quality.factory.local/inspect/l2-final',
    description: 'Final inspection point Line 2',
    productionLine: 'Line 2',
    station: 'ST-99',
    status: 'Active',
    createdBy: 'u-admin',
    createdAt: daysAgo(15),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(1)
  },
  {
    id: 'QR-000012',
    qrTypeId: 'type-ewsl-pos',
    systemId: 'sys-ewsl',
    itemName: 'Position 4 (Draft)',
    qrValue: 'https://ewsl.factory.local/position/4',
    description: 'Draft position not yet activated',
    factory: 'Factory A',
    productionLine: 'Line 4',
    position: 'New Position',
    status: 'Draft',
    createdBy: 'u-admin',
    createdAt: daysAgo(2),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(2)
  },
  {
    id: 'QR-000013',
    qrTypeId: 'type-ewsl-pos',
    systemId: 'sys-ewsl',
    itemName: 'Old Position 1',
    qrValue: 'https://ewsl.factory.local/position/1-old',
    description: 'Replaced by QR-000001',
    factory: 'Factory A',
    productionLine: 'Line 2',
    position: 'Old Left Side',
    status: 'Replaced',
    replacedById: 'QR-000001',
    createdBy: 'u-admin',
    createdAt: daysAgo(100),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(40)
  },
  {
    id: 'QR-000014',
    qrTypeId: 'type-matrack-dash',
    systemId: 'sys-matrack',
    itemName: 'Inactive Warehouse B',
    qrValue: 'https://matrack.factory.local/dashboard/wh-b',
    description: 'Deactivated dashboard',
    area: 'Warehouse B',
    status: 'Inactive',
    createdBy: 'u-admin',
    createdAt: daysAgo(25),
    updatedBy: 'u-admin',
    updatedAt: daysAgo(10)
  }
]

export const seedAuditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    userId: 'u-admin',
    userName: 'Admin User',
    action: 'system.created',
    entityType: 'System',
    entityId: 'sys-ewsl',
    newValue: JSON.stringify({ name: 'e-WSL' }),
    createdAt: daysAgo(90)
  },
  {
    id: 'aud-002',
    userId: 'u-admin',
    userName: 'Admin User',
    action: 'qr_item.created',
    entityType: 'QrItem',
    entityId: 'QR-000001',
    newValue: JSON.stringify({ itemName: 'Position 1' }),
    createdAt: daysAgo(40)
  },
  {
    id: 'aud-003',
    userId: 'u-admin',
    userName: 'Admin User',
    action: 'qr_item.activated',
    entityType: 'QrItem',
    entityId: 'QR-000001',
    oldValue: 'Draft',
    newValue: 'Active',
    createdAt: daysAgo(39)
  }
]

export { now }
