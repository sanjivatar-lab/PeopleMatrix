import { useRef, useState } from 'react'
import {
  Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
  IconButton, InputAdornment, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Close, Search } from '@mui/icons-material'
import { employeeService } from '../services/employeeService'
import type { Employee } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (emp: Employee) => void
  title?: string
  excludeEmpId?: number
}

export default function EmployeeSearchModal({
  open,
  onClose,
  onSelect,
  title = 'Search Employee',
  excludeEmpId,
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Employee[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const runSearch = () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    employeeService
      .getAll(1, 100, q)
      .then((r) => {
        const filtered = excludeEmpId
          ? r.employees.filter((e) => e.emp_id !== excludeEmpId)
          : r.employees
        setResults(filtered)
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false))
  }

  const handleClose = () => {
    setQuery('')
    setResults([])
    onClose()
  }

  const handleSelect = (emp: Employee) => {
    setQuery('')
    setResults([])
    onSelect(emp)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{ onEntered: () => inputRef.current?.focus() }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton size="small" onClick={handleClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            inputRef={inputRef}
            label="Search by First or Last Name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            fullWidth
            placeholder="Type a name and press Enter or click Search"
            InputProps={{
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setQuery(''); setResults([]) }}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={runSearch}
            disabled={!query.trim() || searching}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </Box>

        {searching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : results.length === 0 && query.trim() ? (
          <Typography color="text.secondary" align="center" py={3}>
            No employees found matching "{query}".
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'primary.dark', color: 'white' } }}>
                  <TableCell>Emp ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Enter a name above and click Search.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((emp) => (
                    <TableRow
                      key={emp.emp_id}
                      hover
                      onClick={() => handleSelect(emp)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.50' } }}
                    >
                      <TableCell>{emp.emp_id}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{emp.full_name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}
