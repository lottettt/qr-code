'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import { useAuth } from '@/contexts/AuthContext'
import { can, type Permission } from '@/lib/permissions'

type AuthGuardProps = {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, permission, permissions, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [loading, user, router, pathname])

  if (loading || !user) {
    return (
      <Box className='flex items-center justify-center min-bs-[40vh]'>
        <CircularProgress />
      </Box>
    )
  }

  const required = permissions ?? (permission ? [permission] : [])
  const allowed = required.length === 0 || required.some(p => can(user, p))

  if (!allowed) {
    return (
      fallback ?? (
        <Box className='flex flex-col items-center justify-center min-bs-[40vh] gap-2'>
          <i className='ri-forbid-line text-5xl text-error' />
          <p className='text-lg font-medium'>Access denied</p>
          <p className='text-textSecondary'>You do not have permission to view this page.</p>
        </Box>
      )
    )
  }

  return <>{children}</>
}
