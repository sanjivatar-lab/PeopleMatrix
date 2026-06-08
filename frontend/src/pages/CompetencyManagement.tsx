import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Checkbox, Chip, Divider, FormControl, Grid,
  IconButton, InputAdornment, InputLabel, ListItemText, MenuItem,
  OutlinedInput, Paper, Select, Stack, TextField, Typography,
} from '@mui/material'
import { Add, Close, Search } from '@mui/icons-material'
import { competencyService } from '../services/competencyService'
import EmployeeSearchModal from '../components/EmployeeSearchModal'
import type { Competency, Employee, EmployeeCompetency } from '../types'

const CATEGORY_COLOR: Record<string, 'primary' | 'success' | 'secondary' | 'warning' | 'info' | 'default'> = {
  AI: 'primary',
  Frontend: 'info',
  Backend: 'success',
  Design: 'secondary',
  Infrastructure: 'warning',
}

export default function CompetencyManagement() {
  const [allComps, setAllComps] = useState<Competency[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [empComps, setEmpComps] = useState<EmployeeCompetency[]>([])
  const [toAssign, setToAssign] = useState<number[]>([])
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    competencyService.getAll().then(setAllComps).catch(() => {})
  }, [])

  const loadEmpComps = (empId: number) => {
    competencyService.getForEmployee(empId).then(setEmpComps).catch(() => setEmpComps([]))
  }

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp)
    setToAssign([])
    loadEmpComps(emp.emp_id)
    setSearchOpen(false)
  }

  const clearEmployee = () => {
    setSelectedEmployee(null)
    setEmpComps([])
    setToAssign([])
  }

  const handleCreateComp = async () => {
    if (!newName.trim()) return
    setError(''); setSuccess('')
    try {
      const c = await competencyService.create(newName.trim(), newCat.trim() || undefined)
      setAllComps((prev) => [...prev, c])
      setNewName(''); setNewCat('')
      setSuccess(`Competency "${c.name}" created!`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleAssign = async () => {
    if (!selectedEmployee || toAssign.length === 0) return
    setError(''); setSuccess('')
    try {
      await competencyService.assign(selectedEmployee.emp_id, toAssign)
      setSuccess(`${toAssign.length} competency(ies) assigned!`)
      setToAssign([])
      loadEmpComps(selectedEmployee.emp_id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleRemove = async (competencyId: number) => {
    if (!selectedEmployee) return
    try {
      await competencyService.remove(selectedEmployee.emp_id, competencyId)
      loadEmpComps(selectedEmployee.emp_id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Remove failed')
    }
  }

  const assignedIds = empComps.map((ec) => ec.competency_id)
  const available = allComps.filter((c) => !assignedIds.includes(c.id))

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Competency Management</Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" mb={2}>Create Competency</Typography>
            <TextField fullWidth label="Name" value={newName}
              onChange={(e) => setNewName(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Category (optional)" value={newCat}
              onChange={(e) => setNewCat(e.target.value)} sx={{ mb: 2 }} />
            <Button
              variant="contained" startIcon={<Add />}
              disabled={!newName.trim()} onClick={handleCreateComp}
            >
              Create
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" mb={2}>All Competencies ({allComps.length})</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {allComps.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  size="small"
                  color={CATEGORY_COLOR[c.category || ''] ?? 'default'}
                  variant="outlined"
                />
              ))}
              {allComps.length === 0 && (
                <Typography variant="body2" color="text.secondary">None yet</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Assign Competencies to Employee</Typography>

            {/* ── Employee picker ── */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'flex-start' }}>
              <TextField
                label="Select Employee"
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

            {selectedEmployee && (
              <>
                <Typography variant="subtitle2" mb={1}>
                  Current Competencies ({empComps.length}):
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                  {empComps.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">None assigned yet</Typography>
                  ) : (
                    empComps.map((ec) => (
                      <Chip
                        key={ec.id}
                        label={ec.competency_name}
                        color="success"
                        size="small"
                        onDelete={() => handleRemove(ec.competency_id)}
                      />
                    ))
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Add More Competencies</InputLabel>
                  <Select
                    multiple
                    value={toAssign}
                    onChange={(e) => setToAssign(e.target.value as number[])}
                    input={<OutlinedInput label="Add More Competencies" />}
                    renderValue={(sel) =>
                      (sel as number[])
                        .map((id) => allComps.find((c) => c.id === id)?.name)
                        .join(', ')
                    }
                  >
                    {available.map((comp) => (
                      <MenuItem key={comp.id} value={comp.id}>
                        <Checkbox checked={toAssign.includes(comp.id)} />
                        <ListItemText
                          primary={comp.name}
                          secondary={comp.category ?? ''}
                        />
                      </MenuItem>
                    ))}
                    {available.length === 0 && (
                      <MenuItem disabled>All competencies assigned</MenuItem>
                    )}
                  </Select>
                </FormControl>

                <Button
                  variant="contained" onClick={handleAssign}
                  disabled={toAssign.length === 0}
                >
                  Assign {toAssign.length > 0 ? `(${toAssign.length})` : ''}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <EmployeeSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelectEmployee}
        title="Search Employee"
      />
    </Box>
  )
}
