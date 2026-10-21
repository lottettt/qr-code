'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

import type { Mode } from '@core/types'

import Logo from '@components/layout/shared/Logo'
import Illustrations from '@components/Illustrations'
import themeConfig from '@configs/themeConfig'
import { useImageVariant } from '@core/hooks/useImageVariant'
import { registerUser } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

const Register = ({ mode }: { mode: Mode }) => {
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  const router = useRouter()
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await registerUser({ username, displayName, email })

      await login(user.username, user.role)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='p-6 sm:!p-12'>
          <Link href='/login' className='flex justify-center items-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-5'>
            <div>
              <Typography variant='h4'>Create account</Typography>
              <Typography className='mbs-1'>
                Demo self-register for {themeConfig.templateName}. New accounts get the Viewer role.
              </Typography>
            </div>
            {error && <Alert severity='error'>{error}</Alert>}
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                required
                label='Username'
                value={username}
                onChange={e => setUsername(e.target.value)}
                helperText='3–32 characters: letters, numbers, . _ -'
              />
              <TextField
                fullWidth
                required
                label='Display Name'
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
              <TextField
                fullWidth
                type='email'
                label='Email (optional)'
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Alert severity='info' icon={<i className='ri-information-line' />}>
                Demo mode — no password. A System Administrator can raise your role later.
              </Alert>
              <Button fullWidth variant='contained' type='submit' disabled={submitting}>
                {submitting ? 'Creating…' : 'Register'}
              </Button>
              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>Already have an account?</Typography>
                <Typography component={Link} href='/login' color='primary'>
                  Sign in
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

export default Register
