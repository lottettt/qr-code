'use client'

import { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'

import type { QrItem, QrType, System } from '@/types'
import { getQrType, getSystem, listQrItems } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import QrPreview from '@/components/qr/QrPreview'

export default function ReprintPage() {
  return (
    <AuthGuard permission='qr.print'>
      <ReprintContent />
    </AuthGuard>
  )
}

function ReprintContent() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QrItem[]>([])
  const [selected, setSelected] = useState<QrItem | undefined>()
  const [system, setSystem] = useState<System | undefined>()
  const [qrType, setQrType] = useState<QrType | undefined>()
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])

      return
    }

    const timer = setTimeout(() => {
      setSearching(true)
      listQrItems({ search: query.trim(), includeInactive: false })
        .then(setResults)
        .finally(() => setSearching(false))
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const selectItem = async (item: QrItem) => {
    setSelected(item)
    const [sys, type] = await Promise.all([getSystem(item.systemId), getQrType(item.qrTypeId)])

    setSystem(sys)
    setQrType(type)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4'>Reprint QR Code</Typography>
        <Typography color='text.secondary'>
          Search for an existing QR item by ID or name to reprint without creating a new record.
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Search' />
          <CardContent className='flex flex-col gap-3'>
            <TextField
              fullWidth
              placeholder='QR-000001 or Position 1…'
              value={query}
              onChange={e => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                )
              }}
            />
            <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {results.length === 0 ? (
                <Box className='p-4 text-center'>
                  <Typography variant='body2' color='text.secondary'>
                    {searching ? 'Searching…' : query ? 'No matches' : 'Enter a QR ID or name'}
                  </Typography>
                </Box>
              ) : (
                results.map(item => (
                  <ListItemButton
                    key={item.id}
                    selected={selected?.id === item.id}
                    onClick={() => selectItem(item)}
                  >
                    <ListItemText primary={`${item.id} — ${item.itemName}`} secondary={item.description} />
                  </ListItemButton>
                ))
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title='Preview & Print'
            action={
              selected && (
                <Button
                  variant='contained'
                  startIcon={<i className='ri-printer-line' />}
                  onClick={() => window.open(`/print/${selected.id}`, '_blank')}
                >
                  Print
                </Button>
              )
            }
          />
          <CardContent>
            <QrPreview system={system} qrType={qrType} item={selected} canPrint />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
