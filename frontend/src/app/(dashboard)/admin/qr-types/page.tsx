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
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import type { EntityStatus, LocationField, QrType, System } from '@/types'
import { ALL_LOCATION_FIELDS, LOCATION_FIELD_LABELS } from '@/types'
import { createQrType, listQrTypes, listSystems, updateQrType } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import StatusChip from '@/components/qr/StatusChip'
import { useSnackbar } from '@/contexts/SnackbarContext'

type Row = QrType & { systemName?: string }

const emptyForm = {
  systemId: '',
  typeName: '',
  displayLabel: '',
  description: '',
  requiredFields: [] as LocationField[],
  status: 'Active' as EntityStatus
}

export default function QrTypesPage() {
  return (
    <AuthGuard permission='admin.qrTypes'>
      <QrTypesContent />
    </AuthGuard>
  )
}

function QrTypesContent() {
  const { showMessage } = useSnackbar()
  const [systems, setSystems] = useState<System[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [systemFilter, setSystemFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<QrType | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const [sysList, types] = await Promise.all([
        listSystems({ includeInactive: true }),
        listQrTypes({
          systemId: systemFilter || undefined,
          includeInactive: true
        })
      ])

      setSystems(sysList)
      setRows(
        types.map(t => ({
          ...t,
          systemName: sysList.find(s => s.id === t.systemId)?.name
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, systemId: systemFilter || systems[0]?.id || '' })
    setOpen(true)
  }

  const openEdit = (row: QrType) => {
    setEditing(row)
    setForm({
      systemId: row.systemId,
      typeName: row.typeName,
      displayLabel: row.displayLabel,
      description: row.description,
      requiredFields: [...row.requiredFields],
      status: row.status
    })
    setOpen(true)
  }

  const toggleField = (field: LocationField) => {
    setForm(prev => ({
      ...prev,
      requiredFields: prev.requiredFields.includes(field)
        ? prev.requiredFields.filter(f => f !== field)
        : [...prev.requiredFields, field]
    }))
  }

  const handleSave = async () => {
    if (!form.systemId || !form.typeName.trim() || !form.displayLabel.trim()) {
      showMessage('System, type name, and display label are required', 'warning')

      return
    }

    setSaving(true)

    try {
      if (editing) {
        await updateQrType(editing.id, form)
        showMessage('QR type updated', 'success')
      } else {
        await createQrType(form)
        showMessage('QR type created', 'success')
      }

      setOpen(false)
      load()
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns: GridColDef<Row>[] = [
    { field: 'systemName', headerName: 'System', flex: 1, minWidth: 120 },
    { field: 'typeName', headerName: 'Type Name', flex: 1, minWidth: 140 },
    { field: 'displayLabel', headerName: 'Display Label', flex: 1, minWidth: 120 },
    {
      field: 'requiredFields',
      headerName: 'Required Fields',
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_v, row) => row.requiredFields.map(f => LOCATION_FIELD_LABELS[f]).join(', ')
    },
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
        <Typography variant='h4'>QR Types</Typography>
        <Typography color='text.secondary'>
          Categories under each system with custom display labels and required fields.
        </Typography>
      </Box>
      <Card>
        <CardHeader
          title='QR Types / Categories'
          action={
            <Box className='flex gap-2 items-center'>
              <TextField
                select
                size='small'
                label='System'
                value={systemFilter}
                onChange={e => setSystemFilter(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=''>All systems</MenuItem>
                {systems.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openCreate}>
                Add Type
              </Button>
            </Box>
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
        <DialogTitle>{editing ? 'Edit QR Type' : 'Create QR Type'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          <TextField
            select
            label='System'
            required
            fullWidth
            value={form.systemId}
            onChange={e => setForm({ ...form, systemId: e.target.value })}
            disabled={!!editing}
          >
            {systems
              .filter(s => s.status === 'Active' || s.id === form.systemId)
              .map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            label='Type Name'
            required
            fullWidth
            value={form.typeName}
            onChange={e => setForm({ ...form, typeName: e.target.value })}
          />
          <TextField
            label='Display Label'
            required
            fullWidth
            helperText='Shown to users in the QR Center'
            value={form.displayLabel}
            onChange={e => setForm({ ...form, displayLabel: e.target.value })}
          />
          <TextField
            label='Description'
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <Box>
            <Typography variant='subtitle2' className='mbe-2'>
              Required Location Fields
            </Typography>
            <FormGroup row>
              {ALL_LOCATION_FIELDS.map(field => (
                <FormControlLabel
                  key={field}
                  control={
                    <Checkbox
                      checked={form.requiredFields.includes(field)}
                      onChange={() => toggleField(field)}
                      size='small'
                    />
                  }
                  label={LOCATION_FIELD_LABELS[field]}
                />
              ))}
            </FormGroup>
          </Box>
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
