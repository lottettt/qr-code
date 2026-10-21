'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { QRCodeCanvas } from 'qrcode.react'

import type { QrItem, System } from '@/types'

type Props = {
  item: QrItem
  system?: System
}

export default function QrLabel({ item, system }: Props) {
  const locationParts = [
    item.factory && `Factory: ${item.factory}`,
    item.productionLine && `Line: ${item.productionLine}`,
    item.station && `Station: ${item.station}`,
    item.machine && `Machine: ${item.machine}`,
    item.position && `Position: ${item.position}`
  ].filter(Boolean)

  return (
    <Box
      className='qr-label flex flex-col items-center gap-3 p-6'
      sx={{
        width: 360,
        margin: '0 auto',
        '@media print': {
          boxShadow: 'none',
          border: '1px solid #ccc'
        }
      }}
    >
      <Typography variant='h6' className='text-center'>
        {system?.name ?? 'QR Code Center'}
      </Typography>
      <Typography variant='subtitle1' className='text-center font-medium'>
        {item.itemName}
      </Typography>
      <Box className='flex flex-col items-center gap-1'>
        <QRCodeCanvas value={item.qrValue} size={200} level='M' includeMargin />
        <Typography
          variant='caption'
          className='break-all text-center'
          sx={{ fontSize: '0.65rem', maxWidth: 220, color: 'text.secondary' }}
        >
          {item.qrValue}
        </Typography>
      </Box>
      <Typography variant='body2' color='text.secondary'>
        {item.id}
      </Typography>
      {locationParts.length > 0 && (
        <Box className='text-center'>
          {locationParts.map(p => (
            <Typography key={p} variant='caption' display='block' color='text.secondary'>
              {p}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  )
}
