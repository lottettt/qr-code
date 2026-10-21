'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'

import type { Mode } from '@core/types'
import type { Role } from '@/types'

import Logo from '@components/layout/shared/Logo'
import Illustrations from '@components/Illustrations'
import themeConfig from '@configs/themeConfig'
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useAuth } from '@/contexts/AuthContext'

const ROLES: Role[] = ['Viewer', 'Operator', 'Administrator', 'System Administrator']

const Login = ({ mode }: { mode: Mode }) => {
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  const router = useRouter()
  const searchParams = useSearchParams()
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const { login, demoUsers } = useAuth()

  const [username, setUsername] = useState('viewer')
  const [role, setRole] = useState<Role>('Viewer')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole)
    const match = demoUsers.find(u => u.role === nextRole)

    if (match) setUsername(match.username)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(username.trim() || 'user', role)
      const redirect = searchParams.get('redirect') || '/'

      router.push(redirect)
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='p-6 sm:!p-12'>
          <div className='flex justify-center items-center mbe-6'>
            <Logo />
          </div>
          <div className='flex flex-col gap-5'>
            <div>
              <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}`}</Typography>
              <Typography className='mbs-1'>
                Sign in with a demo role to explore the QR Code Center.
              </Typography>
            </div>
            {error && <Alert severity='error'>{error}</Alert>}
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='Username'
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <TextField
                select
                fullWidth
                label='Role'
                value={role}
                onChange={e => handleRoleChange(e.target.value as Role)}
              >
                {ROLES.map(r => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
              <Alert severity='info' icon={<i className='ri-information-line' />}>
                Demo mode — no password required. Choose a role to test permissions.
              </Alert>
              <Button fullWidth variant='contained' type='submit' disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign In'}
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>New on the platform?</Typography>
                <Typography component={Link} href='/register' color='primary'>
                  Create an account
                </Typography>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  )
}

export default Login
