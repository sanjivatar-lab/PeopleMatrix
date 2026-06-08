import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { ArrowBack, CheckCircle, PersonAdd } from '@mui/icons-material'
import api from '../services/api'
import { supervisorService } from '../services/supervisorService'
import workPackageService from '../services/workPackageService'
import type { PotentialOwner } from '../types'

interface EmployeeRow {
  emp_id: number
  full_name: string
  email: string
  role_name: string
}

interface AssignDialog {
  employee: EmployeeRow
  supervisor: PotentialOwner | null
  start_date: string
}

export default function EmployeesWithoutSupervisor() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [supervisors, setSupervisors] = useState<PotentialOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [dialog, setDialog] = useState<AssignDialog | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/reports/employees-without-supervisor').then((r) => r.data as EmployeeRow[]),
      workPackageService.getPotentialOwners(),
    ])
      .then(([emps, sups]) => {
        setEmployees(emps)
        setSupervisors(sups)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openDialog = (emp: EmployeeRow) => {
    setDialog({ employee: emp, supervisor: null, start_date: '' })
    setDialogError('')
    setSuccess('')
  }

  const handleAssign = () => {
    if (!dialog?.supervisor || !dialog.start_date) return
    setDialogError('')
    setSaving(true)
    supervisorService
      .assign(dialog.employee.emp_id, dialog.supervisor.emp_id, dialog.start_date)
      .then(() => {
        setSuccess(
          `${dialog.employee.full_name} tagged with supervisor ${dialog.supervisor!.full_name}`
        )
        setEmployees((prev) => prev.filter((e) => e.emp_id !== dialog.employee.emp_id))
        setDialog(null)
      })
      .catch((e: Error) => setDialogError(e.message))
      .finally(() => setSaving(false))
  }

  const roleColor = (role: string) => {
    if (role === 'Platform Owner') return 'secondary'
    if (role === 'Supervisor') return 'primary'
    return 'default'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>
          Reports
        </Button>
        <Typography variant="h5" fontWeight={600}>
          Employees Without Supervisor
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Employees below have no current supervisor assigned. Click the tag button to assign a
        supervisor.
      </Typography>

      {success && (
        <Alert
          severity="success"
          icon={<CheckCircle />}
          sx={{ mb: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'primary.dark', color: 'white' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Supervisor</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    All employees have a supervisor assigned.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.emp_id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{emp.full_name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={emp.role_name}
                        size="small"
                        color={roleColor(emp.role_name) as 'primary' | 'secondary' | 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="Not assigned" color="warning" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Assign Supervisor">
                        <IconButton color="primary" size="small" onClick={() => openDialog(emp)}>
                          <PersonAdd fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign dialog */}
      <Dialog
        open={!!dialog}
        onClose={() => { setDialog(null); setDialogError('') }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Supervisor to <strong>{dialog?.employee.full_name}</strong>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {dialogError && <Alert severity="error">{dialogError}</Alert>}

          <Autocomplete
            options={supervisors}
            getOptionLabel={(s) => `${s.full_name} (${s.role_name})`}
            value={dialog?.supervisor ?? null}
            onChange={(_, val) => {
              setDialogError('')
              setDialog((d) => d ? { ...d, supervisor: val } : d)
            }}
            isOptionEqualToValue={(a, b) => a.emp_id === b.emp_id}
            renderInput={(params) => (
              <TextField {...params} label="Supervisor *" />
            )}
            noOptionsText="No employees with Platform Owner or Supervisor role found"
          />

          <TextField
            label="Start Date *"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dialog?.start_date ?? ''}
            onChange={(e) => setDialog((d) => d ? { ...d, start_date: e.target.value } : d)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => { setDialog(null); setDialogError('') }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={saving || !dialog?.supervisor || !dialog?.start_date}
          >
            {saving ? 'Saving…' : 'Assign Supervisor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
