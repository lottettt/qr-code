'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import type { QrItem, QrType, System } from '@/types'
import { listQrItems, listQrTypes, listSystems, getQrItem, getQrType, getSystem } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { can } from '@/lib/permissions'
import SearchableList from '@/components/qr/SearchableList'
import QrPreview from '@/components/qr/QrPreview'

function QrCenterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [systems, setSystems] = useState<System[]>([])
  const [types, setTypes] = useState<QrType[]>([])
  const [items, setItems] = useState<QrItem[]>([])
  const [systemSearch, setSystemSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<System | undefined>()
  const [selectedType, setSelectedType] = useState<QrType | undefined>()
  const [selectedItem, setSelectedItem] = useState<QrItem | undefined>()
  const [loading, setLoading] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const systemId = searchParams.get('system')
  const itemId = searchParams.get('item')

  const updateQuery = useCallback(
    (next: { system?: string | null; item?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString())

      if (next.system !== undefined) {
        if (next.system) params.set('system', next.system)
        else params.delete('system')
      }

      if (next.item !== undefined) {
        if (next.item) params.set('item', next.item)
        else params.delete('item')
      }

      const qs = params.toString()

      router.replace(qs ? `/?${qs}` : '/', { scroll: false })
    },
    [router, searchParams]
  )

  useEffect(() => {
    listSystems()
      .then(setSystems)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!systemId) {
      setSelectedSystem(undefined)
      setTypes([])
      setItems([])
      setSelectedItem(undefined)
      setTypeFilter(null)

      return
    }

    Promise.all([getSystem(systemId), listQrTypes({ systemId }), listQrItems({ systemId })]).then(
      ([sys, qrTypes, qrItems]) => {
        setSelectedSystem(sys)
        setTypes(qrTypes)
        setItems(qrItems)
      }
    )
  }, [systemId])

  useEffect(() => {
    if (!itemId) {
      setSelectedItem(undefined)
      setSelectedType(undefined)
      setPreviewError(null)

      return
    }

    setPreviewError(null)
    getQrItem(itemId)
      .then(async item => {
        if (!item || item.status !== 'Active') {
          setPreviewError('QR code could not be generated because the item is missing or not active.')
          setSelectedItem(undefined)

          return
        }

        if (!item.qrValue?.trim()) {
          setPreviewError(
            'QR code could not be generated because the configured QR value is invalid.'
          )
          setSelectedItem(item)

          return
        }

        setSelectedItem(item)
        const type = await getQrType(item.qrTypeId)

        setSelectedType(type)
      })
      .catch(() => {
        setPreviewError(
          'QR code could not be generated because the configured QR value is invalid.'
        )
      })
  }, [itemId, retryKey])

  const filteredSystems = useMemo(() => {
    const q = systemSearch.toLowerCase()

    return systems
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
      .map(s => ({ id: s.id, primary: s.name, secondary: s.description }))
  }, [systems, systemSearch])

  const filteredItems = useMemo(() => {
    let list = items

    if (typeFilter) list = list.filter(i => i.qrTypeId === typeFilter)

    const q = itemSearch.toLowerCase()

    if (q) {
      list = list.filter(i => {
        const hay = [
          i.itemName,
          i.description,
          i.productionLine,
          i.station,
          i.machine,
          i.position,
          i.id
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return hay.includes(q)
      })
    }

    return list.map(i => {
      const type = types.find(t => t.id === i.qrTypeId)

      return {
        id: i.id,
        primary: i.itemName,
        secondary: [type?.displayLabel, i.productionLine, i.station, i.position].filter(Boolean).join(' · ')
      }
    })
  }, [items, types, typeFilter, itemSearch])

  if (loading) {
    return (
      <Box className='flex justify-center p-12'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TypographyHeader />
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Select System' subheader='Active systems only' />
          <CardContent>
            <SearchableList
              items={filteredSystems}
              selectedId={systemId}
              onSelect={id => {
                setTypeFilter(null)
                setItemSearch('')
                updateQuery({ system: id, item: null })
              }}
              search={systemSearch}
              onSearchChange={setSystemSearch}
              searchPlaceholder='Search systems…'
              emptyText='No active systems found'
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Select QR Item' subheader={selectedSystem?.name ?? 'Select a system first'} />
          <CardContent className='flex flex-col gap-3'>
            {types.length > 0 && (
              <Box className='flex flex-wrap gap-2'>
                <Chip
                  label='All'
                  size='small'
                  color={typeFilter === null ? 'primary' : 'default'}
                  onClick={() => setTypeFilter(null)}
                  variant={typeFilter === null ? 'filled' : 'outlined'}
                />
                {types.map(t => (
                  <Chip
                    key={t.id}
                    label={t.displayLabel}
                    size='small'
                    color={typeFilter === t.id ? 'primary' : 'default'}
                    onClick={() => setTypeFilter(t.id)}
                    variant={typeFilter === t.id ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            )}
            <SearchableList
              items={filteredItems}
              selectedId={itemId}
              onSelect={id => updateQuery({ item: id })}
              search={itemSearch}
              onSearchChange={setItemSearch}
              searchPlaceholder='Search items…'
              emptyText={systemId ? 'No active QR items' : 'Select a system first'}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='QR Preview' />
          <CardContent>
            <QrPreview
              system={selectedSystem}
              qrType={selectedType}
              item={previewError && !selectedItem?.qrValue ? undefined : selectedItem}
              canPrint={can(user, 'qr.print')}
              error={previewError}
              onRetry={() => setRetryKey(k => k + 1)}
              showValue={can(user, 'admin.qrItems')}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

function TypographyHeader() {
  return (
    <Box>
      <h4 className='m-0 text-2xl font-semibold'>QR Code Center</h4>
      <p className='mbs-1 text-textSecondary'>Select a system, then a QR item to view, download, or print.</p>
    </Box>
  )
}

export default function QrCenterPage() {
  return (
    <Suspense
      fallback={
        <Box className='flex justify-center p-12'>
          <CircularProgress />
        </Box>
      }
    >
      <QrCenterContent />
    </Suspense>
  )
}
