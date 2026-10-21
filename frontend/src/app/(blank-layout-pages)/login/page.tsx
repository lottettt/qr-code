import { Suspense } from 'react'

import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import Login from '@views/Login'
import { getServerMode } from '@core/utils/serverHelpers'

const LoginPage = async () => {
  const mode = await getServerMode()

  return (
    <Suspense
      fallback={
        <Box className='flex justify-center items-center min-bs-[100dvh]'>
          <CircularProgress />
        </Box>
      }
    >
      <Login mode={mode} />
    </Suspense>
  )
}

export default LoginPage
