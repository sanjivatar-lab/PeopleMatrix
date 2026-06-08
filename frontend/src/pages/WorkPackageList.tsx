import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import { Add, Assignment, Delete, Edit } from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import type { WorkPackage } from '../types'

export default function WorkPackageList() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<WorkPackage | null>(null)
  const [deleting, setDeleting] = useState(false)

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
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No work packages found. Click "Add Work Package" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((wp) => (
                  <TableRow key={wp.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{wp.name}</TableCell>
                    <TableCell sx={{ maxWidth: 240, color: 'text.secondary' }}>
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
    </Box>
  )
}
