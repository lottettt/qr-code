'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import type { Role, User } from '@/types'
import { listUsers, updateUserRole } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import { useSnackbar } from '@/contexts/SnackbarContext'

const ROLES: Role[] = ['Viewer', 'Operator', 'Administrator', 'System Administrator']

export default function UsersPage() {
  return (
    <AuthGuard permission='admin.users'>
      <UsersContent />
    </AuthGuard>
  )
}

function UsersContent() {
  const { showMessage } = useSnackbar()
  const [rows, setRows] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listUsers()
      .then(setRows)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleRoleChange = async (id: string, role: Role) => {
    try {
      await updateUserRole(id, role)
      showMessage('Role updated', 'success')
      load()
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Update failed', 'error')
    }
  }

  const columns: GridColDef<User>[] = [
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 120 },
    { field: 'displayName', headerName: 'Display Name', flex: 1, minWidth: 140 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 180 },
    {
      field: 'role',
      headerName: 'Role',
      width: 220,
      renderCell: (params: GridRenderCellParams<User>) => (
        <TextField
          select
          size='small'
          value={params.row.role}
          onChange={e => handleRoleChange(params.row.id, e.target.value as Role)}
          sx={{ minWidth: 200 }}
        >
          {ROLES.map(r => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </TextField>
      )
    }
  ]

  return (
    <Box className='flex flex-col gap-4'>
      <Box>
        <Typography variant='h4'>Users & Roles</Typography>
        <Typography color='text.secondary'>Assign roles for mock authentication (demo data).</Typography>
      </Box>
      <Card>
        <CardHeader title='Users' />
        <CardContent>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowId={r => r.id}
            rowHeight={64}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
