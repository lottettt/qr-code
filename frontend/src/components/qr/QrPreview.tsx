'use client'

import { useRef } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { QRCodeCanvas } from 'qrcode.react'

import type { QrItem, QrType, System } from '@/types'
import { LOCATION_FIELD_LABELS, type LocationField } from '@/types'

type Props = {
  system?: System
  qrType?: QrType
  item?: QrItem
  showValue?: boolean // kept for callers; value is always shown under the QR image
  size?: number
  onDownload?: () => void
  onPrint?: () => void
  canPrint?: boolean
  error?: string | null
  onRetry?: () => void
}

const LOCATION_KEYS: LocationField[] = [
  'factory',
  'productionLine',
  'station',
  'machine',
  'position',
  'area',
  'process',
  'physicalLocation'
]

export default function QrPreview({
  system,
  qrType,
  item,
  showValue: _showValue = false,
  size = 220,
  onDownload,
  onPrint,
  canPrint = false,
  error,
  onRetry
}: Props) {
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    const canvas = canvasWrapRef.current?.querySelector('canvas')

    if (!canvas || !item) return

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')

    a.href = url
    a.download = `${item.id}-${item.itemName.replace(/\s+/g, '_')}.png`
    a.click()
    onDownload?.()
  }

  if (error) {
    return (
      <Box className='flex flex-col items-center justify-center gap-3 p-6 text-center'>
        <i className='ri-error-warning-line text-4xl text-error' />
        <Typography color='error'>{error}</Typography>
        <Typography variant='body2' color='text.secondary'>
          Please contact the system administrator or correct the QR configuration.
        </Typography>
        {onRetry && (
          <Button variant='outlined' onClick={onRetry} startIcon={<i className='ri-refresh-line' />}>
            Retry
          </Button>
        )}
      </Box>
    )
  }

  if (!item || !system) {
    return (
      <Box className='flex flex-col items-center justify-center gap-2 p-8 text-center min-bs-[280px]'>
        <i className='ri-qr-code-line text-5xl text-textDisabled' />
        <Typography color='text.secondary'>Select a system and QR item to preview</Typography>
      </Box>
    )
  }

  const breadcrumb = [system.name, qrType?.displayLabel, item.itemName].filter(Boolean).join(' > ')

  return (
    <Box className='flex flex-col items-center gap-4 p-4'>
      <Typography variant='subtitle1' className='text-center font-medium'>
        {breadcrumb}
      </Typography>
      <Typography variant='caption' color='text.secondary'>
        {item.id}
      </Typography>
      <div ref={canvasWrapRef} className='p-3 bg-white rounded border border-solid border-divider flex flex-col items-center gap-1'>
        <QRCodeCanvas value={item.qrValue} size={size} level='M' includeMargin />
        <Typography
          component={/^https?:\/\//i.test(item.qrValue) ? 'a' : 'span'}
          {...(/^https?:\/\//i.test(item.qrValue)
            ? { href: item.qrValue, target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          variant='caption'
          className='break-all text-center max-is-[220px] leading-tight'
          sx={{ fontSize: '0.65rem', color: 'text.secondary', textDecoration: 'none' }}
        >
          {item.qrValue}
        </Typography>
      </div>
      <Box className='flex flex-col gap-1 w-full'>
        {LOCATION_KEYS.map(key => {
          const val = item[key]

          if (!val) return null

          return (
            <Typography key={key} variant='body2' color='text.secondary'>
              <strong>{LOCATION_FIELD_LABELS[key]}:</strong> {val}
            </Typography>
          )
        })}
      </Box>
      <Box className='flex gap-2 flex-wrap justify-center'>
        <Button variant='contained' startIcon={<i className='ri-download-line' />} onClick={handleDownload}>
          Download PNG
        </Button>
        {canPrint && (
          <Button
            variant='outlined'
            startIcon={<i className='ri-printer-line' />}
            onClick={() => {
              onPrint?.()
              window.open(`/print/${item.id}`, '_blank')
            }}
          >
            Print
          </Button>
        )}
      </Box>
    </Box>
  )
}
