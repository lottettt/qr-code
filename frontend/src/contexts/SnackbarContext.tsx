'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

type Severity = 'success' | 'info' | 'warning' | 'error'

type SnackbarContextValue = {
  showMessage: (message: string, severity?: Severity) => void
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined)

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<Severity>('info')

  const showMessage = useCallback((msg: string, sev: Severity = 'info') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ showMessage }), [showMessage])

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setOpen(false)} severity={severity} variant='filled' sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext)

  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')

  return ctx
}
