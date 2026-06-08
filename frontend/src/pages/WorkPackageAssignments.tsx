import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import { Add, ArrowBack, Close, Delete, Edit, Search } from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import EmployeeSearchModal from '../components/EmployeeSearchModal'
import type { WorkPackage, WorkPackageAssignment, Employee } from '../types'

interface AssignForm {
  emp_id: number | null
  start_date: string
  end_date: string
}

const EMPTY_FORM: AssignForm = { emp_id: null, start_date: '', end_date: '' }

export default function WorkPackageAssignments() {
  const navigate = useNavigate()
  const { wpId } = useParams<{ wpId: string }>()
  const id = Number(wpId)

  const [wp, setWp] = useState<WorkPackage | null>(null)
  const [assignments, setAssignments] = useState<WorkPackageAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<WorkPackageAssignment | null>(null)
  const [form, setForm] = useState<AssignForm>(EMPTY_FORM)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [empSearchOpen, setEmpSearchOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<WorkPackageAssignment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = () => {
    Promise.all([
      workPackageService.getById(id),
      workPackageService.getAssignments(id),
    ])
      .then(([wpData, assignData]) => {
        setWp(wpData)
        setAssignments(assignData)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [id])

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setSelectedEmployee(null)
    setDialogOpen(true)
  }

  const openEdit = (a: WorkPackageAssignment) => {
    setEditTarget(a)
    setForm({ emp_id: a.emp_id, start_date: a.start_date, end_date: a.end_date || '' })
    // Reconstruct a minimal Employee-shaped object from the assignment row for display
    setSelectedEmployee({ emp_id: a.emp_id, full_name: a.employee_name, email: '', first_name: '', last_name: '', years_of_experience: 0 })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!selectedEmployee || !form.start_date) return
    if (wp && form.start_date < wp.start_date) {
      setError(`Assignment start date cannot be before work package start date (${wp.start_date})`)
      return
    }
    if (wp?.end_date && form.end_date && form.end_date > wp.end_date) {
      setError(`Assignment end date cannot be after work package end date (${wp.end_date})`)
      return
    }
    if (form.end_date && form.end_date < form.start_date) {
      setError('Assignment end date cannot be before start date')
      return
    }
    setError('')
    setSaving(true)
    const payload = {
      emp_id: selectedEmployee.emp_id,
      start_date: form.start_date,
      end_date: form.end_date || null,
    }

    const request = editTarget
      ? workPackageService.updateAssignment(id, editTarget.id, payload)
      : workPackageService.addAssignment(id, payload)

    request
      .then((saved) => {
        setAssignments((prev) =>
          editTarget
            ? prev.map((a) => (a.id === editTarget.id ? saved : a))
            : [...prev, saved]
        )
        setDialogOpen(false)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setDeleting(true)
    workPackageService.removeAssignment(id, deleteTarget.id)
      .then(() => {
        setAssignments((prev) => prev.filter((a) => a.id !== deleteTarget.id))
        setDeleteTarget(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setDeleting(false))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/work-packages')}>Back</Button>
        <Typography variant="h5" fontWeight={600}>Team Assignments</Typography>
      </Box>

      {wp && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
          <Typography variant="subtitle1" fontWeight={600}>{wp.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {wp.start_date} – {wp.end_date || 'ongoing'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {wp.owners.map((o) => (
              <Chip key={o.id} label={o.employee_name} size="small" color="primary" />
            ))}
          </Box>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
          Add Assignment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'primary.dark', color: 'white' } }}>
              <TableCell>Team Member</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No team members assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{a.employee_name}</TableCell>
                  <TableCell>{a.start_date}</TableCell>
                  <TableCell>{a.end_date || '—'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => openEdit(a)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Assignment' : 'Assign Team Member'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Employee *"
              value={selectedEmployee ? selectedEmployee.full_name : ''}
              placeholder="Click Search to select an employee"
              InputProps={{
                readOnly: true,
                endAdornment: selectedEmployee && !editTarget ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSelectedEmployee(null)} tabIndex={-1}>
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              fullWidth
              disabled={!!editTarget}
              sx={{ bgcolor: editTarget ? undefined : 'grey.50' }}
            />
            {!editTarget && (
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={() => setEmpSearchOpen(true)}
                sx={{ whiteSpace: 'nowrap', height: 56 }}
              >
                Search
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date *"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              inputProps={{ min: wp?.start_date, max: wp?.end_date || undefined }}
              helperText={wp ? `WP: ${wp.start_date} – ${wp.end_date || 'ongoing'}` : ''}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              inputProps={{ min: form.start_date || wp?.start_date, max: wp?.end_date || undefined }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !selectedEmployee || !form.start_date}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Remove Assignment</DialogTitle>
        <DialogContent>
          Remove <strong>{deleteTarget?.employee_name}</strong> from this work package?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <EmployeeSearchModal
        open={empSearchOpen}
        onClose={() => setEmpSearchOpen(false)}
        onSelect={(emp) => { setSelectedEmployee(emp); setEmpSearchOpen(false) }}
        title="Search Team Member"
      />
    </Box>
  )
}
