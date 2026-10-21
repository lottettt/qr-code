'use client'

import { useEffect, useMemo, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import type { QrItem, QrItemStatus, QrType, System } from '@/types'
import { ALL_LOCATION_FIELDS, LOCATION_FIELD_LABELS } from '@/types'
import {
  activateQrItem,
  createQrItem,
  deactivateQrItem,
  findDuplicates,
  getQrItem,
  isValidUrl,
  listQrTypes,
  listSystems,
  looksLikeUrl,
  replaceQrItem,
  updateQrItem,
  validateForActivation,
  type DuplicateMatch
} from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import QrPreview from '@/components/qr/QrPreview'
import StatusChip from '@/components/qr/StatusChip'
import ConfirmDialog from '@/components/qr/ConfirmDialog'
import { useSnackbar } from '@/contexts/SnackbarContext'

const schema = z
  .object({
    systemId: z.string().min(1, 'System is required'),
    qrTypeId: z.string().min(1, 'QR type is required'),
    itemName: z.string().min(1, 'Item name is required'),
    qrValue: z.string().min(1, 'QR value is required'),
    description: z.string().optional(),
    status: z.enum(['Draft', 'Active', 'Inactive', 'Replaced', 'Deprecated']),
    businessUnit: z.string().optional(),
    factory: z.string().optional(),
    building: z.string().optional(),
    floor: z.string().optional(),
    productionLine: z.string().optional(),
    area: z.string().optional(),
    process: z.string().optional(),
    station: z.string().optional(),
    machine: z.string().optional(),
    position: z.string().optional(),
    physicalLocation: z.string().optional(),
    installationNote: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (looksLikeUrl(data.qrValue) && !isValidUrl(data.qrValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid URL format',
        path: ['qrValue']
      })
    }
  })

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  systemId: '',
  qrTypeId: '',
  itemName: '',
  qrValue: '',
  description: '',
  status: 'Draft',
  businessUnit: '',
  factory: '',
  building: '',
  floor: '',
  productionLine: '',
  area: '',
  process: '',
  station: '',
  machine: '',
  position: '',
  physicalLocation: '',
  installationNote: ''
}

export default function QrItemFormPage() {
  return (
    <AuthGuard permission='admin.qrItems'>
      <QrItemFormContent />
    </AuthGuard>
  )
}

function QrItemFormContent() {
  const params = useParams()
  const router = useRouter()
  const { showMessage } = useSnackbar()
  const idParam = params.id as string
  const isNew = idParam === 'new'

  const [systems, setSystems] = useState<System[]>([])
  const [types, setTypes] = useState<QrType[]>([])
  const [existing, setExisting] = useState<QrItem | undefined>()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [dupDialog, setDupDialog] = useState<{ open: boolean; matches: DuplicateMatch[]; pending: FormValues | null }>({
    open: false,
    matches: [],
    pending: null
  })
  const [activateErrors, setActivateErrors] = useState<string[]>([])
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'replace' | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues
  })

  const systemId = watch('systemId')
  const qrTypeId = watch('qrTypeId')
  const watched = watch()

  useEffect(() => {
    listSystems({ includeInactive: true }).then(setSystems)
  }, [])

  useEffect(() => {
    if (!systemId) {
      setTypes([])

      return
    }

    listQrTypes({ systemId, includeInactive: true }).then(setTypes)
  }, [systemId])

  useEffect(() => {
    if (isNew) return

    getQrItem(idParam).then(item => {
      if (!item) {
        showMessage('QR item not found', 'error')
        router.push('/admin/qr-items')

        return
      }

      setExisting(item)
      reset({
        systemId: item.systemId,
        qrTypeId: item.qrTypeId,
        itemName: item.itemName,
        qrValue: item.qrValue,
        description: item.description ?? '',
        status: item.status,
        businessUnit: item.businessUnit ?? '',
        factory: item.factory ?? '',
        building: item.building ?? '',
        floor: item.floor ?? '',
        productionLine: item.productionLine ?? '',
        area: item.area ?? '',
        process: item.process ?? '',
        station: item.station ?? '',
        machine: item.machine ?? '',
        position: item.position ?? '',
        physicalLocation: item.physicalLocation ?? '',
        installationNote: item.installationNote ?? ''
      })
      setLoading(false)
    })
  }, [idParam, isNew, reset, router, showMessage])

  const selectedSystem = useMemo(() => systems.find(s => s.id === systemId), [systems, systemId])
  const selectedType = useMemo(() => types.find(t => t.id === qrTypeId), [types, qrTypeId])

  const previewItem: QrItem | undefined = useMemo(() => {
    if (!watched.itemName || !watched.qrValue || !systemId || !qrTypeId) return undefined

    return {
      id: existing?.id ?? 'PREVIEW',
      systemId,
      qrTypeId,
      itemName: watched.itemName,
      qrValue: watched.qrValue,
      description: watched.description ?? '',
      status: watched.status as QrItemStatus,
      businessUnit: watched.businessUnit,
      factory: watched.factory,
      building: watched.building,
      floor: watched.floor,
      productionLine: watched.productionLine,
      area: watched.area,
      process: watched.process,
      station: watched.station,
      machine: watched.machine,
      position: watched.position,
      physicalLocation: watched.physicalLocation,
      installationNote: watched.installationNote,
      createdBy: existing?.createdBy ?? '',
      createdAt: existing?.createdAt ?? '',
      updatedBy: existing?.updatedBy ?? '',
      updatedAt: existing?.updatedAt ?? ''
    }
  }, [watched, systemId, qrTypeId, existing])

  const persist = async (data: FormValues) => {
    setSaving(true)

    try {
      if (isNew) {
        const created = await createQrItem({
          ...data,
          description: data.description ?? '',
          status: data.status === 'Active' ? 'Draft' : data.status
        })

        showMessage(`Created ${created.id}`, 'success')
        router.push(`/admin/qr-items/${created.id}`)
      } else {
        await updateQrItem(idParam, {
          ...data,
          description: data.description ?? ''
        })
        showMessage('QR item updated', 'success')
        const refreshed = await getQrItem(idParam)

        setExisting(refreshed)
      }
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
      setDupDialog({ open: false, matches: [], pending: null })
    }
  }

  const onSubmit = async (data: FormValues) => {
    const matches = findDuplicates(
      {
        systemId: data.systemId,
        qrTypeId: data.qrTypeId,
        itemName: data.itemName,
        qrValue: data.qrValue,
        productionLine: data.productionLine,
        position: data.position
      },
      isNew ? undefined : idParam
    )

    if (matches.length > 0) {
      setDupDialog({ open: true, matches, pending: data })

      return
    }

    await persist(data)
  }

  const handleActivate = async () => {
    if (!existing) return

    const current = {
      ...existing,
      ...getValues(),
      description: getValues().description ?? ''
    } as QrItem

    const validation = validateForActivation(current, selectedType)

    if (!validation.ok) {
      setActivateErrors(validation.errors)
      showMessage('Cannot activate — fix the issues listed below', 'error')

      return
    }

    setActivateErrors([])

    try {
      await updateQrItem(existing.id, getValues())
      const updated = await activateQrItem(existing.id)

      setExisting(updated)
      setValue('status', 'Active')
      showMessage('QR item activated', 'success')
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Activation failed', 'error')
    }
  }

  const handleDeactivate = async () => {
    if (!existing) return

    try {
      const updated = await deactivateQrItem(existing.id)

      setExisting(updated)
      setValue('status', 'Inactive')
      showMessage('QR item deactivated', 'success')
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Deactivation failed', 'error')
    } finally {
      setConfirmAction(null)
    }
  }

  const handleReplace = async () => {
    if (!existing) return
    const data = getValues()

    try {
      const { newItem } = await replaceQrItem(existing.id, {
        ...data,
        description: data.description ?? '',
        status: 'Active'
      })

      showMessage(`Replaced with ${newItem.id}`, 'success')
      router.push(`/admin/qr-items/${newItem.id}`)
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Replace failed', 'error')
    } finally {
      setConfirmAction(null)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center p-12'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className='flex flex-col gap-4'>
      <Box className='flex flex-wrap justify-between gap-3 items-start'>
        <Box>
          <Typography variant='h4'>{isNew ? 'New QR Item' : `Edit ${existing?.id}`}</Typography>
          <Typography color='text.secondary'>Configure QR value, location, and status.</Typography>
        </Box>
        {!isNew && existing && (
          <Box className='flex gap-2 items-center flex-wrap'>
            <StatusChip status={existing.status} />
            {existing.status !== 'Active' && existing.status !== 'Replaced' && (
              <Button variant='contained' color='success' onClick={handleActivate}>
                Activate
              </Button>
            )}
            {existing.status === 'Active' && (
              <Button variant='outlined' color='warning' onClick={() => setConfirmAction('deactivate')}>
                Deactivate
              </Button>
            )}
            {existing.status === 'Active' && (
              <Button variant='outlined' color='secondary' onClick={() => setConfirmAction('replace')}>
                Replace
              </Button>
            )}
          </Box>
        )}
      </Box>

      {activateErrors.length > 0 && (
        <Alert severity='error'>
          <Typography fontWeight={600}>Cannot activate until these are fixed:</Typography>
          <ul className='mbs-2'>
            {activateErrors.map(err => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={8}>
            <Card className='mbe-6'>
              <CardHeader title='Basic Information' />
              <CardContent className='flex flex-col gap-4'>
                <Controller
                  name='systemId'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label='System'
                      required
                      fullWidth
                      error={!!errors.systemId}
                      helperText={errors.systemId?.message}
                      disabled={!isNew}
                      onChange={e => {
                        field.onChange(e)
                        setValue('qrTypeId', '')
                      }}
                    >
                      {systems
                        .filter(s => s.status === 'Active' || s.id === field.value)
                        .map(s => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
                <Controller
                  name='qrTypeId'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label='QR Type'
                      required
                      fullWidth
                      error={!!errors.qrTypeId}
                      helperText={errors.qrTypeId?.message}
                      disabled={!systemId}
                    >
                      {types
                        .filter(t => t.status === 'Active' || t.id === field.value)
                        .map(t => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.displayLabel} ({t.typeName})
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
                <Controller
                  name='itemName'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Item Name'
                      required
                      fullWidth
                      error={!!errors.itemName}
                      helperText={errors.itemName?.message}
                    />
                  )}
                />
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => <TextField {...field} label='Description' fullWidth multiline rows={2} />}
                />
                {isNew && (
                  <Controller
                    name='status'
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label='Initial Status' fullWidth>
                        <MenuItem value='Draft'>Draft</MenuItem>
                        <MenuItem value='Inactive'>Inactive</MenuItem>
                      </TextField>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card className='mbe-6'>
              <CardHeader title='QR Value' />
              <CardContent>
                <Controller
                  name='qrValue'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='QR Value / URL'
                      required
                      fullWidth
                      error={!!errors.qrValue}
                      helperText={errors.qrValue?.message ?? 'Stored value used to generate the QR image'}
                    />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title='Location Information' />
              <CardContent>
                <Grid container spacing={4}>
                  {ALL_LOCATION_FIELDS.map(fieldName => {
                    const required = selectedType?.requiredFields.includes(fieldName)

                    return (
                      <Grid item xs={12} sm={6} key={fieldName}>
                        <Controller
                          name={fieldName}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label={LOCATION_FIELD_LABELS[fieldName] + (required ? ' *' : '')}
                              fullWidth
                              size='small'
                            />
                          )}
                        />
                      </Grid>
                    )
                  })}
                </Grid>
              </CardContent>
            </Card>

            <Box className='flex gap-2 mbs-4'>
              <Button type='submit' variant='contained' disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant='outlined' onClick={() => router.push('/admin/qr-items')}>
                Back
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title='Live Preview' />
              <CardContent>
                <QrPreview system={selectedSystem} qrType={selectedType} item={previewItem} showValue />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      <ConfirmDialog
        open={dupDialog.open}
        title='Possible Duplicate Detected'
        message={
          <Box>
            <Typography className='mbe-2'>
              Similar QR items were found. You may continue (warning only) or cancel to review.
            </Typography>
            <List dense>
              {dupDialog.matches.map(m => (
                <ListItem key={m.id}>
                  <ListItemText primary={`${m.id} — ${m.itemName}`} secondary={m.reason} />
                </ListItem>
              ))}
            </List>
          </Box>
        }
        confirmLabel='Save Anyway'
        confirmColor='warning'
        onCancel={() => setDupDialog({ open: false, matches: [], pending: null })}
        onConfirm={() => dupDialog.pending && persist(dupDialog.pending)}
      />

      <ConfirmDialog
        open={confirmAction === 'deactivate'}
        title='Deactivate QR Item'
        message='The item will be hidden from normal users but retained for history.'
        confirmLabel='Deactivate'
        confirmColor='warning'
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={confirmAction === 'replace'}
        title='Replace QR Item'
        message='A new QR item will be created from the current form values. The old item will be marked Replaced and linked to the new one.'
        confirmLabel='Replace'
        confirmColor='secondary'
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleReplace}
      />
    </Box>
  )
}
