'use client'

import Chip from '@mui/material/Chip'

import type { EntityStatus, QrItemStatus } from '@/types'

const COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info' | 'secondary'> = {
  Active: 'success',
  Draft: 'warning',
  Inactive: 'default',
  Replaced: 'secondary',
  Deprecated: 'error'
}

export default function StatusChip({ status }: { status: EntityStatus | QrItemStatus }) {
  return <Chip size='small' label={status} color={COLOR_MAP[status] ?? 'default'} variant='tonal' />
}
