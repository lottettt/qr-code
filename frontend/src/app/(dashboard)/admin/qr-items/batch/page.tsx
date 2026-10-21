'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import AuthGuard from '@/components/AuthGuard'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { listQrItems, listQrTypes, listSystems, upsertQrItemsBatch } from '@/lib/api'
import {
  downloadQrBatchTemplate,
  parseAndValidateQrBatch,
  type QrBatchValidatedRow
} from '@/lib/excel/qrBatch'
import type { QrItem, QrType, System } from '@/types'

export default function BatchQrImportPage() {
  return (
    <AuthGuard permission='admin.qrItems'>
      <BatchQrImportContent />
    </AuthGuard>
  )
}

function BatchQrImportContent() {
  const router = useRouter()
  const { showMessage } = useSnackbar()
  const fileRef = useRef<HTMLInputElement>(null)

  const [systems, setSystems] = useState<System[]>([])
  const [qrTypes, setTypes] = useState<QrType[]>([])
  const [existingItems, setExistingItems] = useState<QrItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [formatErrors, setFormatErrors] = useState<string[]>([])
  const [rows, setRows] = useState<QrBatchValidatedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    Promise.all([
      listSystems({ includeInactive: true }),
      listQrTypes({ includeInactive: true }),
      listQrItems({ includeInactive: true })
    ])
      .then(([s, t, items]) => {
        setSystems(s)
        setTypes(t)
        setExistingItems(items)
      })
      .finally(() => setLoadingMeta(false))
  }, [])

  const stats = useMemo(() => {
    const valid = rows.filter(r => r.ok).length
    const invalid = rows.filter(r => !r.ok).length
    const toCreate = rows.filter(r => r.ok && r.action === 'create').length
    const toUpdate = rows.filter(r => r.ok && r.action === 'update').length
    const warned = rows.filter(r => r.ok && r.warnings.length > 0).length

    return { valid, invalid, toCreate, toUpdate, warned, total: rows.length }
  }, [rows])

  const handleDownloadTemplate = () => {
    downloadQrBatchTemplate(systems, qrTypes)
    showMessage('Template downloaded', 'success')
  }

  const handleFile = async (file: File | null) => {
    if (!file) return

    setFileName(file.name)
    setFormatErrors([])
    setRows([])

    const ext = file.name.toLowerCase()

    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      setFormatErrors(['Please upload an Excel file (.xlsx).'])

      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const result = parseAndValidateQrBatch(buffer, systems, qrTypes, existingItems)

      setFormatErrors(result.formatErrors)
      setRows(result.rows)

      if (result.formatErrors.length > 0) {
        showMessage('Excel format is invalid', 'error')
      } else if (result.rows.every(r => r.ok)) {
        const creates = result.rows.filter(r => r.action === 'create').length
        const updates = result.rows.filter(r => r.action === 'update').length

        showMessage(`Validated: ${creates} create, ${updates} update`, 'success')
      } else {
        showMessage('Validation finished with errors — fix invalid rows before import', 'warning')
      }
    } catch {
      setFormatErrors(['Could not read the Excel file. Please use the official template.'])
      showMessage('Failed to read Excel file', 'error')
    }
  }

  const handleImport = async () => {
    const upserts = rows
      .filter(r => r.ok && r.payload && r.action)
      .map(r => ({
        action: r.action!,
        existingItemId: r.existingItemId,
        payload: r.payload!
      }))

    if (upserts.length === 0) {
      showMessage('No valid rows to import', 'warning')

      return
    }

    if (stats.invalid > 0) {
      showMessage('Fix or remove invalid rows before importing', 'error')

      return
    }

    setImporting(true)

    try {
      const { created, updated } = await upsertQrItemsBatch(upserts)

      showMessage(`Done: ${created.length} created, ${updated.length} updated`, 'success')
      router.push('/admin/qr-items')
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Import failed', 'error')
    } finally {
      setImporting(false)
    }
  }

  const columns: GridColDef<QrBatchValidatedRow>[] = [
    { field: 'rowNumber', headerName: 'Row', width: 70 },
    {
      field: 'ok',
      headerName: 'Result',
      width: 100,
      renderCell: params =>
        params.row.ok ? (
          <Chip size='small' label='OK' color='success' variant='tonal' />
        ) : (
          <Chip size='small' label='Error' color='error' variant='tonal' />
        )
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 110,
      renderCell: params => {
        if (!params.row.ok || !params.row.action) return '—'

        return (
          <Chip
            size='small'
            label={params.row.action === 'update' ? 'Update' : 'Create'}
            color={params.row.action === 'update' ? 'info' : 'primary'}
            variant='tonal'
          />
        )
      }
    },
    {
      field: 'existingItemId',
      headerName: 'Existing ID',
      width: 120,
      valueGetter: (_v, row) => row.existingItemId ?? '—'
    },
    {
      field: 'systemName',
      headerName: 'System',
      flex: 1,
      minWidth: 120,
      valueGetter: (_v, row) => row.raw.systemName
    },
    {
      field: 'qrType',
      headerName: 'QR Type',
      flex: 1,
      minWidth: 120,
      valueGetter: (_v, row) => row.raw.qrType
    },
    {
      field: 'itemName',
      headerName: 'Item Name',
      flex: 1,
      minWidth: 140,
      valueGetter: (_v, row) => row.raw.itemName
    },
    {
      field: 'qrValue',
      headerName: 'QR Value',
      flex: 1.2,
      minWidth: 180,
      valueGetter: (_v, row) => row.raw.qrValue
    },
    {
      field: 'messages',
      headerName: 'Messages',
      flex: 1.5,
      minWidth: 220,
      valueGetter: (_v, row) => [...row.errors, ...row.warnings].join(' | ') || '—'
    }
  ]

  return (
    <Box className='flex flex-col gap-4'>
      <Box>
        <Typography variant='h4'>Batch Import QR Codes</Typography>
        <Typography color='text.secondary'>
          Download the Excel template, fill in QR items, then upload. Matching key (System + QR Type + Item Name)
          updates the existing record; new keys create.
        </Typography>
      </Box>

      <Card>
        <CardHeader title='1. Download template' />
        <CardContent className='flex flex-col gap-3'>
          <Typography variant='body2' color='text.secondary'>
            The template includes an Instructions sheet and a Reference sheet listing existing systems, QR types, and
            required fields.
          </Typography>
          <Button
            variant='outlined'
            startIcon={<i className='ri-download-line' />}
            onClick={handleDownloadTemplate}
            disabled={loadingMeta}
            sx={{ alignSelf: 'flex-start' }}
          >
            Download Excel Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='2. Upload filled file' />
        <CardContent className='flex flex-col gap-3'>
          <input
            ref={fileRef}
            type='file'
            accept='.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
            hidden
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
          <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' useFlexGap>
            <Button
              variant='contained'
              startIcon={<i className='ri-upload-2-line' />}
              onClick={() => fileRef.current?.click()}
              disabled={loadingMeta}
            >
              Choose Excel File
            </Button>
            {fileName && (
              <Typography variant='body2' color='text.secondary'>
                Selected: {fileName}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {(formatErrors.length > 0 || rows.length > 0) && (
        <Card>
          <CardHeader
            title='3. Validation result'
            subheader={
              rows.length > 0
                ? `${stats.total} row(s) · ${stats.toCreate} create · ${stats.toUpdate} update · ${stats.invalid} invalid`
                : undefined
            }
          />
          <CardContent className='flex flex-col gap-3'>
            {formatErrors.map(err => (
              <Alert key={err} severity='error'>
                {err}
              </Alert>
            ))}

            {rows.length > 0 && (
              <>
                <DataGrid
                  autoHeight
                  rows={rows}
                  columns={columns}
                  getRowId={r => String(r.rowNumber)}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  getRowClassName={params => (params.row.ok ? '' : 'row-error')}
                />
                <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
                  <Button
                    variant='contained'
                    color='primary'
                    startIcon={<i className='ri-check-line' />}
                    onClick={handleImport}
                    disabled={importing || stats.valid === 0 || stats.invalid > 0}
                  >
                    {importing
                      ? 'Importing…'
                      : `Import (${stats.toCreate} create, ${stats.toUpdate} update)`}
                  </Button>
                  <Button component={Link} href='/admin/qr-items' variant='outlined'>
                    Cancel
                  </Button>
                </Stack>
                {stats.invalid > 0 && (
                  <Alert severity='warning'>
                    Import is blocked until all rows are valid. Fix the Excel file and upload again.
                  </Alert>
                )}
                {stats.warned > 0 && stats.invalid === 0 && (
                  <Alert severity='info'>
                    Some rows have duplicate warnings. You can still import — review them if needed.
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
