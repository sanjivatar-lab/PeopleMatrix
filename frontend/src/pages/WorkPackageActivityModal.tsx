import { useEffect, useState } from 'react'
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, MenuItem, Select, Stack, TextField,
  Tooltip, Typography,
} from '@mui/material'
import { Add, Check, Close, Delete, Edit } from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import type { WpActivity } from '../types'

const STATUSES = ['To Do', 'In Progress', 'Done'] as const

type StatusColor = 'default' | 'warning' | 'success'
const statusColor = (s: string): StatusColor =>
  s === 'Done' ? 'success' : s === 'In Progress' ? 'warning' : 'default'

interface Props {
  wpId: number
  wpName: string
  onClose: () => void
}

export default function WorkPackageActivityModal({ wpId, wpName, onClose }: Props) {
  const [activities, setActivities] = useState<WpActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add form
  const [addDesc, setAddDesc] = useState('')
  const [addStatus, setAddStatus] = useState('To Do')
  const [adding, setAdding] = useState(false)

  // Inline edit
  const [editId, setEditId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState('To Do')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    workPackageService.getActivities(wpId)
      .then(setActivities)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [wpId])

  const handleAdd = async () => {
    if (!addDesc.trim()) return
    setAdding(true)
    setError('')
    try {
      const created = await workPackageService.addActivity(wpId, {
        description: addDesc.trim(),
        status: addStatus,
      })
      setActivities((prev) => [created, ...prev])
      setAddDesc('')
      setAddStatus('To Do')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add activity')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (a: WpActivity) => {
    setEditId(a.id)
    setEditDesc(a.description)
    setEditStatus(a.status)
  }

  const handleEditSave = async () => {
    if (editId === null) return
    setSaving(true)
    setError('')
    try {
      const updated = await workPackageService.updateActivity(wpId, editId, {
        description: editDesc.trim(),
        status: editStatus,
      })
      setActivities((prev) => prev.map((a) => (a.id === editId ? updated : a)))
      setEditId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setError('')
    try {
      await workPackageService.deleteActivity(wpId, id)
      setActivities((prev) => prev.filter((a) => a.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="span">Activities</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }} component="span">
          — {wpName}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Add form */}
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            label="Describe the activity"
            multiline
            maxRows={3}
            value={addDesc}
            onChange={(e) => setAddDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          />
          <Select
            size="small"
            value={addStatus}
            onChange={(e) => setAddStatus(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
          <Button
            variant="contained"
            startIcon={adding ? <CircularProgress size={14} color="inherit" /> : <Add />}
            onClick={handleAdd}
            disabled={!addDesc.trim() || adding}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : activities.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No activities yet. Add the first one above.
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {activities.map((a) =>
              editId === a.id ? (
                <Stack
                  key={a.id}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{ p: 1.5, bgcolor: 'action.selected', borderRadius: 1 }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    maxRows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    autoFocus
                  />
                  <Select
                    size="small"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    sx={{ minWidth: 140 }}
                  >
                    {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                  <Tooltip title="Save">
                    <IconButton size="small" color="primary" onClick={handleEditSave} disabled={saving}>
                      <Check fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton size="small" onClick={() => setEditId(null)}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ) : (
                <Stack
                  key={a.id}
                  direction="row"
                  alignItems="flex-start"
                  spacing={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:hover .row-actions': { visibility: 'visible' },
                  }}
                >
                  <Chip
                    label={a.status}
                    size="small"
                    color={statusColor(a.status)}
                    sx={{ flexShrink: 0, mt: 0.25 }}
                  />
                  <Typography sx={{ flex: 1, wordBreak: 'break-word' }}>{a.description}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flexShrink: 0, mt: 0.4, whiteSpace: 'nowrap' }}
                  >
                    {new Date(a.created_at).toLocaleDateString()}
                  </Typography>
                  <Stack direction="row" className="row-actions" sx={{ visibility: 'hidden', flexShrink: 0 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => startEdit(a)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              )
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
