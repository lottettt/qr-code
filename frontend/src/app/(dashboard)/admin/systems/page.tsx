'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import type { EntityStatus, System } from '@/types'
import { createSystem, listSystems, updateSystem } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import StatusChip from '@/components/qr/StatusChip'
import { useSnackbar } from '@/contexts/SnackbarContext'

const emptyForm = {
  name: '',
  description: '',
  systemOwner: '',
  contact: '',
  baseUrl: '',
  status: 'Active' as EntityStatus
}

export default function SystemsPage() {
  return (
    <AuthGuard permission='admin.systems'>
      <SystemsContent />
    </AuthGuard>
  )
}

function SystemsContent() {
  const { showMessage } = useSnackbar()
  const [rows, setRows] = useState<System[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<System | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    listSystems({ includeInactive: true })
      .then(setRows)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (sys: System) => {
    setEditing(sys)
    setForm({
      name: sys.name,
      description: sys.description,
      systemOwner: sys.systemOwner,
      contact: sys.contact,
      baseUrl: sys.baseUrl ?? '',
      status: sys.status
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showMessage('System name is required', 'warning')

      return
    }

    setSaving(true)

    try {
      if (editing) {
        await updateSystem(editing.id, form)
        showMessage('System updated', 'success')
      } else {
        await createSystem(form)
        showMessage('System created', 'success')
      }

      setOpen(false)
      load()
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns: GridColDef<System>[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'systemOwner', headerName: 'Owner', flex: 1, minWidth: 120 },
    { field: 'contact', headerName: 'Contact', flex: 1, minWidth: 160 },
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
        <IconButton size='small' onClick={() => openEdit(params.row)}>
          <i className='ri-edit-line' />
        </IconButton>
      )
    }
  ]

  return (
    <Box className='flex flex-col gap-4'>
      <Box>
        <Typography variant='h4'>Systems</Typography>
        <Typography color='text.secondary'>Register and manage factory systems that use QR codes.</Typography>
      </Box>
      <Card>
        <CardHeader
          title='Registered Systems'
          action={
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
              Add System
            </Button>
          }
        />
        <CardContent>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editing ? 'Edit System' : 'Register System'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          <TextField
            label='System Name'
            required
            fullWidth
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label='Description'
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            label='System Owner'
            fullWidth
            value={form.systemOwner}
            onChange={e => setForm({ ...form, systemOwner: e.target.value })}
          />
          <TextField
            label='Contact'
            fullWidth
            value={form.contact}
            onChange={e => setForm({ ...form, contact: e.target.value })}
          />
          <TextField
            label='Base URL'
            fullWidth
            value={form.baseUrl}
            onChange={e => setForm({ ...form, baseUrl: e.target.value })}
          />
          <TextField
            select
            label='Status'
            fullWidth
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as EntityStatus })}
          >
            <MenuItem value='Active'>Active</MenuItem>
            <MenuItem value='Inactive'>Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
