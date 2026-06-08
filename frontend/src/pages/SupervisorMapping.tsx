import { useState } from 'react'
import {
  Alert, Box, Button, Chip, InputAdornment, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material'
import { Close, Search } from '@mui/icons-material'
import { supervisorService } from '../services/supervisorService'
import EmployeeSearchModal from '../components/EmployeeSearchModal'
import type { Employee, SupervisorMapping as SM } from '../types'

export default function SupervisorMapping() {
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [selectedSup, setSelectedSup] = useState<Employee | null>(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [history, setHistory] = useState<SM[]>([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // modal state
  const [empSearchOpen, setEmpSearchOpen] = useState(false)
  const [supSearchOpen, setSupSearchOpen] = useState(false)

  const loadHistory = (empId: number) => {
    supervisorService.getHistory(empId).then(setHistory).catch(() => setHistory([]))
  }

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmp(emp)
    setSelectedSup(null)
    setHistory([])
    loadHistory(emp.emp_id)
    setEmpSearchOpen(false)
  }

  const handleSelectSupervisor = (emp: Employee) => {
    setSelectedSup(emp)
    setSupSearchOpen(false)
  }

  const clearEmployee = () => {
    setSelectedEmp(null)
    setSelectedSup(null)
    setHistory([])
  }

  const handleAssign = async () => {
    if (!selectedEmp || !selectedSup || !startDate) return
    setError(''); setSuccess('')
    try {
      await supervisorService.assign(selectedEmp.emp_id, selectedSup.emp_id, startDate)
      setSuccess(`Supervisor "${selectedSup.full_name}" assigned successfully!`)
      loadHistory(selectedEmp.emp_id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  const currentSup = history.find((m) => !m.end_date)

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Supervisor Mapping</Typography>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 700 }}>
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Select Employee ── */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Select Employee"
            value={selectedEmp ? `${selectedEmp.full_name}  (ID: ${selectedEmp.emp_id})` : ''}
            placeholder="Click Search to select an employee"
            InputProps={{
              readOnly: true,
              endAdornment: selectedEmp ? (
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
            onClick={() => setEmpSearchOpen(true)}
            sx={{ whiteSpace: 'nowrap', height: 56 }}
          >
            Search
          </Button>
        </Box>

        {currentSup && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Current supervisor: <strong>{currentSup.supervisor_name}</strong>
            {' '}(since {currentSup.start_date})
          </Alert>
        )}

        {/* ── Assign Supervisor ── */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Assign Supervisor"
            value={selectedSup ? `${selectedSup.full_name}  (ID: ${selectedSup.emp_id})` : ''}
            placeholder={selectedEmp ? 'Click Search to select a supervisor' : 'Select an employee first'}
            InputProps={{
              readOnly: true,
              endAdornment: selectedSup ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSelectedSup(null)} tabIndex={-1}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            fullWidth
            disabled={!selectedEmp}
            sx={{ bgcolor: selectedEmp ? 'grey.50' : undefined }}
          />
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={() => setSupSearchOpen(true)}
            disabled={!selectedEmp}
            sx={{ whiteSpace: 'nowrap', height: 56 }}
          >
            Search
          </Button>
        </Box>

        <TextField
          fullWidth type="date" label="Start Date" value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained" onClick={handleAssign}
          disabled={!selectedEmp || !selectedSup || !startDate}
        >
          Assign Supervisor
        </Button>
      </Paper>

      {history.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Supervisor History</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Employee</strong></TableCell>
                  <TableCell><strong>Supervisor</strong></TableCell>
                  <TableCell><strong>Start Date</strong></TableCell>
                  <TableCell><strong>End Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.employee_name}</TableCell>
                    <TableCell>{m.supervisor_name}</TableCell>
                    <TableCell>{m.start_date}</TableCell>
                    <TableCell>{m.end_date || '—'}</TableCell>
                    <TableCell>
                      {!m.end_date
                        ? <Chip label="Active" size="small" color="success" />
                        : <Chip label="Closed" size="small" variant="outlined" />
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <EmployeeSearchModal
        open={empSearchOpen}
        onClose={() => setEmpSearchOpen(false)}
        onSelect={handleSelectEmployee}
        title="Search Employee"
      />

      <EmployeeSearchModal
        open={supSearchOpen}
        onClose={() => setSupSearchOpen(false)}
        onSelect={handleSelectSupervisor}
        title="Search Supervisor"
        excludeEmpId={selectedEmp?.emp_id}
      />
    </Box>
  )
}
