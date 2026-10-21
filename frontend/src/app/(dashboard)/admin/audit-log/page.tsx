'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import type { AuditLog } from '@/types'
import { listAuditLogs } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'

export default function AuditLogPage() {
  return (
    <AuthGuard permission='admin.audit'>
      <AuditLogContent />
    </AuthGuard>
  )
}

function AuditLogContent() {
  const [rows, setRows] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAuditLogs()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const columns: GridColDef<AuditLog>[] = [
    {
      field: 'createdAt',
      headerName: 'Date / Time',
      width: 180,
      valueFormatter: value => new Date(value as string).toLocaleString()
    },
    { field: 'userName', headerName: 'User', width: 140 },
    { field: 'action', headerName: 'Action', width: 160 },
    { field: 'entityType', headerName: 'Entity', width: 100 },
    { field: 'entityId', headerName: 'Entity ID', width: 140 },
    {
      field: 'oldValue',
      headerName: 'Previous',
      flex: 1,
      minWidth: 140,
      valueFormatter: value => truncate(value as string | undefined)
    },
    {
      field: 'newValue',
      headerName: 'New',
      flex: 1,
      minWidth: 140,
      valueFormatter: value => truncate(value as string | undefined)
    }
  ]

  return (
    <Box className='flex flex-col gap-4'>
      <Box>
        <Typography variant='h4'>Audit Log</Typography>
        <Typography color='text.secondary'>Configuration changes recorded for traceability.</Typography>
      </Box>
      <Card>
        <CardHeader title='History' />
        <CardContent>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            getRowId={r => r.id}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

function truncate(value?: string, max = 80) {
  if (!value) return '—'
  if (value.length <= max) return value

  return value.slice(0, max) + '…'
}
