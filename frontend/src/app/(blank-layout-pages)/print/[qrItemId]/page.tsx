'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import type { QrItem, System } from '@/types'
import { getQrItem, getSystem } from '@/lib/api'
import QrLabel from '@/components/qr/QrLabel'

export default function PrintPage() {
  const params = useParams()
  const qrItemId = String(params.qrItemId)
  const [item, setItem] = useState<QrItem | undefined>()
  const [system, setSystem] = useState<System | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getQrItem(qrItemId)
      .then(async qrItem => {
        if (!qrItem) {
          setError('QR item not found')

          return
        }

        setItem(qrItem)
        const sys = await getSystem(qrItem.systemId)

        setSystem(sys)
      })
      .catch(() => setError('Failed to load QR item'))
      .finally(() => setLoading(false))
  }, [qrItemId])

  useEffect(() => {
    if (item && !loading) {
      const timer = setTimeout(() => window.print(), 400)

      return () => clearTimeout(timer)
    }
  }, [item, loading])

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-bs-[100dvh]'>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !item) {
    return (
      <Box className='flex flex-col justify-center items-center min-bs-[100dvh] gap-2'>
        <Typography color='error'>{error || 'Not found'}</Typography>
      </Box>
    )
  }

  return (
    <Box className='p-6'>
      <Box className='flex justify-center gap-2 mbe-4 print:hidden'>
        <Button variant='contained' startIcon={<i className='ri-printer-line' />} onClick={() => window.print()}>
          Print
        </Button>
        <Button variant='outlined' onClick={() => window.close()}>
          Close
        </Button>
      </Box>
      <QrLabel item={item} system={system} />
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .qr-label,
          .qr-label * {
            visibility: visible;
          }
          .qr-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  )
}
