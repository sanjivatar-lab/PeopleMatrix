import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogContent, DialogTitle, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import { ArrowBack, Close } from '@mui/icons-material'
import api from '../services/api'
import { supervisorService } from '../services/supervisorService'
import type { SupervisorMapping } from '../types'

interface SummaryRow {
  emp_id: number
  full_name: string
  email: string
  team_count: number
}

export default function SupervisorTeamSummary() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<SummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [drillSupervisor, setDrillSupervisor] = useState<SummaryRow | null>(null)
  const [members, setMembers] = useState<SupervisorMapping[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  useEffect(() => {
    api
      .get('/reports/supervisor-team-summary')
      .then((r) => setRows(r.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const openDrill = (row: SummaryRow) => {
    setDrillSupervisor(row)
    setMembers([])
    setMembersLoading(true)
    supervisorService
      .getTeam(row.emp_id)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setMembersLoading(false))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>
          Reports
        </Button>
        <Typography variant="h5" fontWeight={600}>
          Supervisor Team Summary
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Supervisors and Platform Owners with their current team size. Click the count to see the
        full team list.
      </Typography>

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
                <TableCell>Supervisor Name</TableCell>
                <TableCell>Emp ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Team Members</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No supervisors found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.emp_id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{row.full_name}</TableCell>
                    <TableCell>{row.emp_id}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.team_count}
                        color={row.team_count > 0 ? 'primary' : 'default'}
                        size="small"
                        clickable={row.team_count > 0}
                        onClick={row.team_count > 0 ? () => openDrill(row) : undefined}
                        sx={row.team_count > 0 ? { fontWeight: 700, cursor: 'pointer' } : {}}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Team members drill-down dialog */}
      <Dialog
        open={!!drillSupervisor}
        onClose={() => setDrillSupervisor(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            Team Members of{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
              {drillSupervisor?.full_name}
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setDrillSupervisor(null)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 0 }}>
          {membersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Emp ID</TableCell>
                    <TableCell>Reporting Since</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No current team members.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{m.employee_name}</TableCell>
                        <TableCell>{m.employee_emp_id}</TableCell>
                        <TableCell>{m.start_date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
