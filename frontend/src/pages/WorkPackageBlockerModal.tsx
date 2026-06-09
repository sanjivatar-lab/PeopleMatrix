import { useEffect, useState } from 'react'
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, MenuItem, Select, Stack, TextField,
  Tooltip, Typography,
} from '@mui/material'
import { Add, Check, CheckCircle, Close, Delete, Edit } from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import type { WpBlocker } from '../types'

const today = () => new Date().toISOString().split('T')[0]

interface Props {
  wpId: number
  wpName: string
  onClose: () => void
}

export default function WorkPackageBlockerModal({ wpId, wpName, onClose }: Props) {
  const [blockers, setBlockers] = useState<WpBlocker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add form
  const [addDesc, setAddDesc] = useState('')
  const [addRaisedOn, setAddRaisedOn] = useState(today())
  const [adding, setAdding] = useState(false)

  // Inline edit
  const [editId, setEditId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState('Open')
  const [editRaisedOn, setEditRaisedOn] = useState('')
  const [editResolvedOn, setEditResolvedOn] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    workPackageService.getBlockers(wpId)
      .then(setBlockers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [wpId])

  const handleAdd = async () => {
    if (!addDesc.trim()) return
    setAdding(true)
    setError('')
    try {
      const created = await workPackageService.addBlocker(wpId, {
        description: addDesc.trim(),
        raised_on: addRaisedOn || null,
      })
      setBlockers((prev) => [created, ...prev])
      setAddDesc('')
      setAddRaisedOn(today())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add blocker')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (b: WpBlocker) => {
    setEditId(b.id)
    setEditDesc(b.description)
    setEditStatus(b.status)
    setEditRaisedOn(b.raised_on ?? '')
    setEditResolvedOn(b.resolved_on ?? '')
  }

  const handleEditSave = async () => {
    if (editId === null) return
    setSaving(true)
    setError('')
    try {
      const updated = await workPackageService.updateBlocker(wpId, editId, {
        description: editDesc.trim(),
        status: editStatus,
        raised_on: editRaisedOn || null,
        resolved_on: editStatus === 'Resolved' ? (editResolvedOn || today()) : null,
      })
      setBlockers((prev) => prev.map((b) => (b.id === editId ? updated : b)))
      setEditId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickResolve = async (b: WpBlocker) => {
    setError('')
    try {
      const updated = await workPackageService.updateBlocker(wpId, b.id, {
        status: 'Resolved',
        resolved_on: today(),
      })
      setBlockers((prev) => prev.map((x) => (x.id === b.id ? updated : x)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to resolve')
    }
  }

  const handleDelete = async (id: number) => {
    setError('')
    try {
      await workPackageService.deleteBlocker(wpId, id)
      setBlockers((prev) => prev.filter((b) => b.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const openCount = blockers.filter((b) => b.status === 'Open').length

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" component="span">Blockers</Typography>
          <Typography variant="body2" color="text.secondary" component="span">— {wpName}</Typography>
          {openCount > 0 && (
            <Chip
              label={`${openCount} open`}
              size="small"
              color="error"
              sx={{ ml: 1 }}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Add form */}
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            label="Describe the blocker"
            multiline
            maxRows={3}
            value={addDesc}
            onChange={(e) => setAddDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          />
          <TextField
            size="small"
            label="Raised on"
            type="date"
            value={addRaisedOn}
            onChange={(e) => setAddRaisedOn(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 155 }}
          />
          <Button
            variant="contained"
            color="error"
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
        ) : blockers.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No blockers recorded. Add one above.
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {blockers.map((b) =>
              editId === b.id ? (
                <Stack
                  key={b.id}
                  spacing={1.5}
                  sx={{ p: 1.5, bgcolor: 'action.selected', borderRadius: 1 }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    maxRows={4}
                    label="Description"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    autoFocus
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Select
                      size="small"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      sx={{ minWidth: 130 }}
                    >
                      <MenuItem value="Open">Open</MenuItem>
                      <MenuItem value="Resolved">Resolved</MenuItem>
                    </Select>
                    <TextField
                      size="small"
                      label="Raised on"
                      type="date"
                      value={editRaisedOn}
                      onChange={(e) => setEditRaisedOn(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 155 }}
                    />
                    {editStatus === 'Resolved' && (
                      <TextField
                        size="small"
                        label="Resolved on"
                        type="date"
                        value={editResolvedOn}
                        onChange={(e) => setEditResolvedOn(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 155 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }} />
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
                </Stack>
              ) : (
                <Stack
                  key={b.id}
                  direction="row"
                  alignItems="flex-start"
                  spacing={1.5}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:hover .row-actions': { visibility: 'visible' },
                  }}
                >
                  <Chip
                    label={b.status}
                    size="small"
                    color={b.status === 'Open' ? 'error' : 'success'}
                    sx={{ flexShrink: 0, mt: 0.25 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ wordBreak: 'break-word' }}>{b.description}</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                      {b.raised_on && (
                        <Typography variant="caption" color="text.secondary">
                          Raised: {b.raised_on}
                        </Typography>
                      )}
                      {b.resolved_on && (
                        <Typography variant="caption" color="success.main">
                          Resolved: {b.resolved_on}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" className="row-actions" sx={{ visibility: 'hidden', flexShrink: 0 }}>
                    {b.status === 'Open' && (
                      <Tooltip title="Mark Resolved">
                        <IconButton size="small" color="success" onClick={() => handleQuickResolve(b)}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => startEdit(b)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(b.id)}>
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
