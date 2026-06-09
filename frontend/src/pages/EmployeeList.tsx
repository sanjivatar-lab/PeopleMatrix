import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField,
  Typography,
} from '@mui/material'
import { Add, Delete, Edit, Search } from '@mui/icons-material'
import { employeeService } from '../services/employeeService'
import type { Employee } from '../types'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function EmployeeList() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [bloodGroupFilter, setBloodGroupFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await employeeService.getAll(
        page + 1, rowsPerPage,
        search || undefined,
        bloodGroupFilter || undefined,
      )
      setEmployees(res.employees)
      setTotal(res.total)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, search, bloodGroupFilter])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleDelete = async (empId: number, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return
    try {
      await employeeService.delete(empId)
      fetchEmployees()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Employees</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/employees/new')}>
          Add Employee
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, or native place…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
        <FormControl sx={{ minWidth: 170 }}>
          <InputLabel>Blood Group</InputLabel>
          <Select
            label="Blood Group"
            value={bloodGroupFilter}
            onChange={(e) => { setBloodGroupFilter(e.target.value); setPage(0) }}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {BLOOD_GROUPS.map((bg) => (
              <MenuItem key={bg} value={bg}>{bg}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Full Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Mobile</strong></TableCell>
                <TableCell><strong>Native Place</strong></TableCell>
                <TableCell><strong>Experience</strong></TableCell>
                <TableCell><strong>Blood Group</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.emp_id} hover>
                    <TableCell>{emp.emp_id}</TableCell>
                    <TableCell>{emp.full_name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.mobile_number || '—'}</TableCell>
                    <TableCell>{emp.native_place || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${emp.years_of_experience} yrs`}
                        size="small" color="info" variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {emp.blood_group
                        ? <Chip label={emp.blood_group} size="small" color="error" variant="outlined" />
                        : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small" color="primary"
                        onClick={() => navigate(`/employees/${emp.emp_id}/edit`)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small" color="error"
                        onClick={() => handleDelete(emp.emp_id, emp.full_name)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
        />
      </Paper>
    </Box>
  )
}
