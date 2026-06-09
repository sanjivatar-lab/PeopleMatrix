import { useState } from 'react'
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, ListItemIcon, MenuItem, Select,
  Typography,
} from '@mui/material'
import { Circle } from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import type { WorkPackage } from '../types'

export const WP_STATUSES = [
  { value: 'On Track',    label: 'On Track',    color: '#2e7d32', muiColor: 'success' },
  { value: 'In Progress', label: 'In Progress', color: '#1565c0', muiColor: 'info'    },
  { value: 'At Risk',     label: 'At Risk',     color: '#e65100', muiColor: 'warning' },
] as const

export type WpStatusValue = typeof WP_STATUSES[number]['value']

interface Props {
  wp: WorkPackage
  onClose: () => void
  onUpdated: (updated: WorkPackage) => void
}

export default function WorkPackageStatusModal({ wp, onClose, onUpdated }: Props) {
  const [selected, setSelected] = useState<string>(wp.status ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await workPackageService.updateStatus(wp.id, selected || null)
      onUpdated(updated)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const statusMeta = WP_STATUSES.find((s) => s.value === selected)

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6">Update Status</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{wp.name}</Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth size="medium">
          <InputLabel id="wp-status-label">Status</InputLabel>
          <Select
            labelId="wp-status-label"
            label="Status"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            renderValue={(val) => {
              if (!val) return <Typography color="text.secondary">— Not set —</Typography>
              const meta = WP_STATUSES.find((s) => s.value === val)
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Circle sx={{ fontSize: 14, color: meta?.color }} />
                  <span>{val}</span>
                </Box>
              )
            }}
          >
            <MenuItem value="">
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Circle sx={{ fontSize: 14, color: 'text.disabled' }} />
              </ListItemIcon>
              <Typography color="text.secondary">— Not set —</Typography>
            </MenuItem>
            {WP_STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Circle sx={{ fontSize: 14, color: s.color }} />
                </ListItemIcon>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Live preview */}
        {statusMeta && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              bgcolor: `${statusMeta.color}18`,
              border: `1px solid ${statusMeta.color}55`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Circle sx={{ fontSize: 12, color: statusMeta.color }} />
            <Typography variant="body2" sx={{ color: statusMeta.color, fontWeight: 600 }}>
              This work package will be marked as <strong>{statusMeta.label}</strong>
            </Typography>
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1.5 }}>{error}</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || selected === (wp.status ?? '')}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={statusMeta ? { bgcolor: statusMeta.color, '&:hover': { bgcolor: statusMeta.color, filter: 'brightness(0.88)' } } : undefined}
        >
          {saving ? 'Saving…' : 'Save Status'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
