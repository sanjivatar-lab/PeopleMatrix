import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import { Add, Assignment, Block, CalendarMonth, Circle, Delete, Edit, EventNote, People } from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import type { WorkPackage } from '../types'
import WorkPackageActivityModal from './WorkPackageActivityModal'
import WorkPackageBlockerModal from './WorkPackageBlockerModal'
import WorkPackageStatusModal, { WP_STATUSES } from './WorkPackageStatusModal'
import WorkPackageWeekPlanModal from './WorkPackageWeekPlanModal'

export default function WorkPackageList() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<WorkPackage | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activityWp, setActivityWp] = useState<WorkPackage | null>(null)
  const [blockerWp, setBlockerWp] = useState<WorkPackage | null>(null)
  const [statusWp, setStatusWp] = useState<WorkPackage | null>(null)
  const [weekPlanWp, setWeekPlanWp] = useState<WorkPackage | null>(null)

  const load = () => {
    setLoading(true)
    workPackageService.getAll()
      .then(setPackages)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = () => {
    if (!deleteTarget) return
    setDeleting(true)
    workPackageService.delete(deleteTarget.id)
      .then(() => {
        setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        setDeleteTarget(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setDeleting(false))
  }

  // After closing a modal, refresh the list so counts stay in sync
  const handleActivityClose = () => {
    setActivityWp(null)
    load()
  }

  const handleBlockerClose = () => {
    setBlockerWp(null)
    load()
  }

  const handleStatusUpdated = (updated: WorkPackage) => {
    setPackages((prev) => prev.map((p) => (p.id === updated.id ? { ...p, status: updated.status } : p)))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Work Packages</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/work-packages/new')}>
          Add Work Package
        </Button>
      </Box>

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
                <TableCell>Description</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Owners</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Team Members</TableCell>
                <TableCell align="center">Week Plan</TableCell>
                <TableCell align="center">Activities</TableCell>
                <TableCell align="center">Blockers</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No work packages found. Click "Add Work Package" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((wp) => (
                  <TableRow key={wp.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{wp.name}</TableCell>
                    <TableCell sx={{ maxWidth: 200, color: 'text.secondary' }}>
                      {wp.description || '—'}
                    </TableCell>
                    <TableCell>{wp.start_date}</TableCell>
                    <TableCell>{wp.end_date || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {wp.owners.map((o) => (
                          <Chip key={o.id} label={o.employee_name} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center">
                      {(() => {
                        const meta = WP_STATUSES.find((s) => s.value === wp.status)
                        return (
                          <Tooltip title={meta ? `Status: ${meta.label}` : 'Click to set status'}>
                            <Box
                              component="button"
                              onClick={() => setStatusWp(wp)}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.75,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '16px',
                                border: '1.5px solid',
                                borderColor: meta ? meta.color : 'grey.400',
                                bgcolor: meta ? `${meta.color}18` : 'transparent',
                                color: meta ? meta.color : 'text.secondary',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'filter .15s',
                                '&:hover': { filter: 'brightness(0.9)' },
                              }}
                            >
                              <Circle sx={{ fontSize: 10 }} />
                              {meta ? meta.label : 'Set Status'}
                            </Box>
                          </Tooltip>
                        )
                      })()}
                    </TableCell>

                    {/* Team Members count */}
                    <TableCell align="center">
                      <Chip
                        icon={<People fontSize="small" />}
                        label={wp.assignment_count}
                        size="small"
                        color={wp.assignment_count > 0 ? 'success' : 'default'}
                        variant={wp.assignment_count > 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>

                    {/* Week Plan button */}
                    <TableCell align="center">
                      <Tooltip title="Week-wise Plan">
                        <IconButton
                          size="small"
                          onClick={() => setWeekPlanWp(wp)}
                          sx={{ color: 'primary.main' }}
                        >
                          <CalendarMonth fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    {/* Activities button */}
                    <TableCell align="center">
                      <Tooltip title={`Activities (${wp.activity_count})`}>
                        <IconButton
                          size="small"
                          onClick={() => setActivityWp(wp)}
                          sx={{ color: 'secondary.main' }}
                        >
                          <Badge
                            badgeContent={wp.activity_count}
                            color="secondary"
                            max={99}
                            showZero={false}
                          >
                            <EventNote fontSize="small" />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    {/* Blockers button */}
                    <TableCell align="center">
                      <Tooltip title={`Blockers (${wp.blocker_count})`}>
                        <IconButton
                          size="small"
                          onClick={() => setBlockerWp(wp)}
                          sx={{ color: wp.blocker_count > 0 ? 'error.main' : 'text.secondary' }}
                        >
                          <Badge
                            badgeContent={wp.blocker_count}
                            color="error"
                            max={99}
                            showZero={false}
                          >
                            <Block fontSize="small" />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Tooltip title="Manage Assignments">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/work-packages/${wp.id}/assignments`)}
                        >
                          <Assignment fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/work-packages/${wp.id}/edit`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(wp)}>
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
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Work Package</DialogTitle>
        <DialogContent>
          Delete <strong>{deleteTarget?.name}</strong>? This will also remove all team assignments.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity modal */}
      {activityWp && (
        <WorkPackageActivityModal
          wpId={activityWp.id}
          wpName={activityWp.name}
          onClose={handleActivityClose}
        />
      )}

      {/* Blocker modal */}
      {blockerWp && (
        <WorkPackageBlockerModal
          wpId={blockerWp.id}
          wpName={blockerWp.name}
          onClose={handleBlockerClose}
        />
      )}

      {/* Status modal */}
      {statusWp && (
        <WorkPackageStatusModal
          wp={statusWp}
          onClose={() => setStatusWp(null)}
          onUpdated={handleStatusUpdated}
        />
      )}

      {/* Week Plan modal */}
      {weekPlanWp && (
        <WorkPackageWeekPlanModal
          wp={weekPlanWp}
          onClose={() => setWeekPlanWp(null)}
        />
      )}
    </Box>
  )
}
