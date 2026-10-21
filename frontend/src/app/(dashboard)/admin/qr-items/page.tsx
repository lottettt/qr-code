'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import type { QrItem, QrItemStatus, QrType, System } from '@/types'
import { listQrItems, listQrTypes, listSystems } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import StatusChip from '@/components/qr/StatusChip'

type Row = QrItem & { systemName?: string; typeLabel?: string }

export default function QrItemsPage() {
  return (
    <AuthGuard permission='admin.qrItems'>
      <QrItemsContent />
    </AuthGuard>
  )
}

function QrItemsContent() {
  const router = useRouter()
  const [systems, setSystems] = useState<System[]>([])
  const [types, setTypes] = useState<QrType[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [systemFilter, setSystemFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)

    try {
      const [sysList, typeList, items] = await Promise.all([
        listSystems({ includeInactive: true }),
        listQrTypes({ systemId: systemFilter || undefined, includeInactive: true }),
        listQrItems({
          systemId: systemFilter || undefined,
          qrTypeId: typeFilter || undefined,
          search: search || undefined,
          includeInactive: true,
          status: statusFilter ? (statusFilter as QrItemStatus) : undefined
        })
      ])

      // When status filter is empty but includeInactive, listQrItems without status returns only Active
      // unless includeInactive is true — our API filters Active only when !includeInactive.
      // With includeInactive and no status, all items returned. Good.

      setSystems(sysList)
      setTypes(typeList)

      let filtered = items

      if (statusFilter) {
        filtered = items.filter(i => i.status === statusFilter)
      }

      setRows(
        filtered.map(i => ({
          ...i,
          systemName: sysList.find(s => s.id === i.systemId)?.name,
          typeLabel: typeList.find(t => t.id === i.qrTypeId)?.displayLabel
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 200)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemFilter, typeFilter, statusFilter, search])

  useEffect(() => {
    setTypeFilter('')
  }, [systemFilter])

  const columns: GridColDef<Row>[] = [
    { field: 'id', headerName: 'QR ID', width: 120 },
    { field: 'itemName', headerName: 'Item Name', flex: 1, minWidth: 140 },
    { field: 'systemName', headerName: 'System', width: 140 },
    { field: 'typeLabel', headerName: 'Type', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: params => <StatusChip status={params.value} />
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: params => (
        <IconButton size='small' onClick={() => router.push(`/admin/qr-items/${params.row.id}`)}>
          <i className='ri-edit-line' />
        </IconButton>
      )
    }
  ]

  return (
    <Box className='flex flex-col gap-4'>
      <Box>
        <Typography variant='h4'>QR Items</Typography>
        <Typography color='text.secondary'>Create and manage QR definitions for factory systems.</Typography>
      </Box>
      <Card>
        <CardHeader
          title='QR Items'
          action={
            <Box className='flex gap-2 flex-wrap'>
              <Button
                component={Link}
                href='/admin/qr-items/batch'
                variant='outlined'
                startIcon={<i className='ri-file-excel-2-line' />}
              >
                Batch Import
              </Button>
              <Button
                component={Link}
                href='/admin/qr-items/new'
                variant='contained'
                startIcon={<i className='ri-add-line' />}
              >
                New QR Item
              </Button>
            </Box>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          <Box className='flex flex-wrap gap-3'>
            <TextField
              select
              size='small'
              label='System'
              value={systemFilter}
              onChange={e => setSystemFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              {systems.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size='small'
              label='Type'
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              {types.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.displayLabel}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value=''>All</MenuItem>
              {(['Draft', 'Active', 'Inactive', 'Replaced', 'Deprecated'] as QrItemStatus[]).map(s => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size='small'
              label='Search'
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Box>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={r => r.id}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
