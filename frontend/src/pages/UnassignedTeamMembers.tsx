import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { ArrowBack, AssignmentInd, CheckCircle } from '@mui/icons-material'
import api from '../services/api'
import workPackageService from '../services/workPackageService'
import type { WorkPackage } from '../types'

interface UnassignedEmployee {
  emp_id: number
  full_name: string
  email: string
}

interface AssignDialog {
  employee: UnassignedEmployee
  workPackage: WorkPackage | null
  start_date: string
  end_date: string
}

export default function UnassignedTeamMembers() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<UnassignedEmployee[]>([])
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [dialog, setDialog] = useState<AssignDialog | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/reports/unassigned-team-members').then((r) => r.data as UnassignedEmployee[]),
      workPackageService.getAll(),
    ])
      .then(([emps, wps]) => {
        setEmployees(emps)
        setWorkPackages(wps)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openDialog = (emp: UnassignedEmployee) => {
    setDialog({ employee: emp, workPackage: null, start_date: '', end_date: '' })
    setError('')
    setSuccess('')
  }

  const wpStartDate = dialog?.workPackage?.start_date ?? ''
  const wpEndDate = dialog?.workPackage?.end_date ?? ''

  const handleAssign = () => {
    if (!dialog?.workPackage || !dialog.start_date) return

    const { workPackage, start_date, end_date } = dialog

    if (start_date < workPackage.start_date) {
      setError(`Start date cannot be before work package start date (${workPackage.start_date})`)
      return
    }
    if (workPackage.end_date && end_date && end_date > workPackage.end_date) {
      setError(`End date cannot be after work package end date (${workPackage.end_date})`)
      return
    }
    if (end_date && end_date < start_date) {
      setError('End date cannot be before start date')
      return
    }

    setError('')
    setSaving(true)
    workPackageService
      .addAssignment(workPackage.id, {
        emp_id: dialog.employee.emp_id,
        start_date,
        end_date: end_date || null,
      })
      .then(() => {
        setSuccess(`${dialog.employee.full_name} assigned to "${workPackage.name}"`)
        setEmployees((prev) => prev.filter((e) => e.emp_id !== dialog.employee.emp_id))
        setDialog(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>
          Reports
        </Button>
        <Typography variant="h5" fontWeight={600}>
          Unassigned Team Members
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Team Members below have no active work package assignment. Click the assign button to add
        them to a work package.
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
      {error && !dialog && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    All team members are currently assigned to a work package.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.emp_id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{emp.full_name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>
                      <Chip label="Unassigned" color="warning" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Assign to Work Package">
                        <IconButton color="primary" size="small" onClick={() => openDialog(emp)}>
                          <AssignmentInd fontSize="small" />
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
        onClose={() => { setDialog(null); setError('') }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign <strong>{dialog?.employee.full_name}</strong> to a Work Package
        </DialogTitle>

        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Autocomplete
            options={workPackages}
            getOptionLabel={(wp) =>
              `${wp.name}  (${wp.start_date} – ${wp.end_date || 'ongoing'})`
            }
            value={dialog?.workPackage ?? null}
            onChange={(_, wp) => {
              setError('')
              setDialog((d) => d ? { ...d, workPackage: wp, start_date: '', end_date: '' } : d)
            }}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => <TextField {...params} label="Work Package *" />}
            noOptionsText="No work packages found"
          />

          {dialog?.workPackage && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              Work package dates: <strong>{dialog.workPackage.start_date}</strong> –{' '}
              <strong>{dialog.workPackage.end_date || 'ongoing'}</strong>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date *"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dialog?.start_date ?? ''}
              onChange={(e) => setDialog((d) => d ? { ...d, start_date: e.target.value } : d)}
              inputProps={{ min: wpStartDate, max: wpEndDate || undefined }}
              disabled={!dialog?.workPackage}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dialog?.end_date ?? ''}
              onChange={(e) => setDialog((d) => d ? { ...d, end_date: e.target.value } : d)}
              inputProps={{
                min: dialog?.start_date || wpStartDate,
                max: wpEndDate || undefined,
              }}
              disabled={!dialog?.workPackage}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => { setDialog(null); setError('') }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={saving || !dialog?.workPackage || !dialog?.start_date}
          >
            {saving ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
