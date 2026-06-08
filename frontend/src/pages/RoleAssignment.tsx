import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Close, Search } from '@mui/icons-material'
import { roleService } from '../services/roleService'
import { employeeService } from '../services/employeeService'
import EmployeeSearchModal from '../components/EmployeeSearchModal'
import type { Employee, EmployeeRole, Role } from '../types'

const ROLE_COLOR: Record<string, 'primary' | 'secondary' | 'success' | 'default'> = {
  'Platform Owner': 'primary',
  'Supervisor': 'secondary',
  'Team Member': 'success',
}

function RoleBadge({ empId, refresh }: { empId: number; refresh: number }) {
  const [role, setRole] = useState<EmployeeRole | null | undefined>(undefined)

  useEffect(() => {
    roleService.getEmployeeRole(empId).then(setRole).catch(() => setRole(null))
  }, [empId, refresh])

  if (role === undefined) return <CircularProgress size={14} />
  if (!role) return <Chip label="Unassigned" size="small" variant="outlined" />
  return <Chip label={role.role_name} size="small" color={ROLE_COLOR[role.role_name] ?? 'default'} />
}

export default function RoleAssignment() {
  // ── form state ────────────────────────────────────────────────────────────
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [currentRole, setCurrentRole] = useState<EmployeeRole | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  // ── bottom table ──────────────────────────────────────────────────────────
  const [tableEmployees, setTableEmployees] = useState<Employee[]>([])

  // ── search modal ──────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false)

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    roleService.getAll().then(setRoles).catch(() => {})
    employeeService.getAll(1, 1000)
      .then((r) => setTableEmployees(r.employees))
      .catch(() => {})
  }, [])

  // ── load current role whenever selected employee changes ──────────────────
  useEffect(() => {
    if (!selectedEmployee) { setCurrentRole(null); return }
    roleService.getEmployeeRole(selectedEmployee.emp_id)
      .then((r) => { setCurrentRole(r); if (r) setSelectedRole(String(r.role_id)) })
      .catch(() => setCurrentRole(null))
  }, [selectedEmployee, refresh])

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp)
    setSearchOpen(false)
    setSelectedRole('')
    setCurrentRole(null)
  }

  const clearEmployee = () => {
    setSelectedEmployee(null)
    setSelectedRole('')
    setCurrentRole(null)
  }

  // ── assign ────────────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedEmployee || !selectedRole) return
    setError(''); setSuccess('')
    try {
      const r = await roleService.assignRole(selectedEmployee.emp_id, parseInt(selectedRole))
      setSuccess(`Role "${r.role_name}" assigned to ${selectedEmployee.full_name}`)
      setRefresh((n) => n + 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Role Assignment</Typography>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 600 }}>
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Employee picker row ── */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Selected Employee"
            value={selectedEmployee ? `${selectedEmployee.full_name}  (${selectedEmployee.email})` : ''}
            placeholder="Click Search to select an employee"
            InputProps={{
              readOnly: true,
              endAdornment: selectedEmployee ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearEmployee} tabIndex={-1}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            fullWidth
            sx={{ bgcolor: 'grey.50' }}
          />
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={() => setSearchOpen(true)}
            sx={{ whiteSpace: 'nowrap', height: 56 }}
          >
            Search
          </Button>
        </Box>

        {currentRole && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Current role: <strong>{currentRole.role_name}</strong>
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Role</InputLabel>
          <Select
            value={selectedRole} label="Select Role"
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={!selectedEmployee}
          >
            {roles.map((r) => (
              <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained" onClick={handleAssign}
          disabled={!selectedEmployee || !selectedRole}
        >
          Assign Role
        </Button>
      </Paper>

      {/* ── All Employee Roles table ── */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">All Employee Roles</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>Employee</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableEmployees.map((emp) => (
                <TableRow key={emp.emp_id} hover>
                  <TableCell>{emp.full_name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>
                    <RoleBadge empId={emp.emp_id} refresh={refresh} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <EmployeeSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelectEmployee}
        title="Search Employee"
      />
    </Box>
  )
}
