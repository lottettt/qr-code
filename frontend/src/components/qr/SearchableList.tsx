'use client'

import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type Item = {
  id: string
  primary: string
  secondary?: string
}

type Props = {
  items: Item[]
  selectedId?: string | null
  onSelect: (id: string) => void
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  emptyText?: string
  maxHeight?: number | string
}

export default function SearchableList({
  items,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  emptyText = 'No items found',
  maxHeight = 420
}: Props) {
  return (
    <Box className='flex flex-col gap-3'>
      <TextField
        size='small'
        fullWidth
        placeholder={searchPlaceholder}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <i className='ri-search-line' />
            </InputAdornment>
          )
        }}
      />
      <List
        dense
        sx={{
          maxHeight,
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          py: 0
        }}
      >
        {items.length === 0 ? (
          <Box className='p-4 text-center'>
            <Typography variant='body2' color='text.secondary'>
              {emptyText}
            </Typography>
          </Box>
        ) : (
          items.map(item => (
            <ListItemButton
              key={item.id}
              selected={selectedId === item.id}
              onClick={() => onSelect(item.id)}
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <ListItemText primary={item.primary} secondary={item.secondary} />
            </ListItemButton>
          ))
        )}
      </List>
    </Box>
  )
}
