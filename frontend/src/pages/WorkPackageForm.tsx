import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Chip,
  Paper, TextField, Typography,
} from '@mui/material'
import { Save, ArrowBack } from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import type { PotentialOwner } from '../types'

interface FormState {
  name: string
  description: string
  start_date: string
  end_date: string
  owner_emp_ids: number[]
}

const EMPTY: FormState = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  owner_emp_ids: [],
}

export default function WorkPackageForm() {
  const navigate = useNavigate()
  const { wpId } = useParams<{ wpId: string }>()
  const isEdit = !!wpId

  const [form, setForm] = useState<FormState>(EMPTY)
  const [owners, setOwners] = useState<PotentialOwner[]>([])
  const [selectedOwners, setSelectedOwners] = useState<PotentialOwner[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    workPackageService.getPotentialOwners()
      .then(setOwners)
      .catch(() => setError('Could not load potential owners'))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    workPackageService.getById(Number(wpId))
      .then((wp) => {
        setForm({
          name: wp.name,
          description: wp.description || '',
          start_date: wp.start_date,
          end_date: wp.end_date || '',
          owner_emp_ids: wp.owners.map((o) => o.emp_id),
        })
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [wpId, isEdit])

  // Sync selectedOwners when owners list and form are both loaded
  useEffect(() => {
    if (!owners.length || !form.owner_emp_ids.length) return
    setSelectedOwners(owners.filter((o) => form.owner_emp_ids.includes(o.emp_id)))
  }, [owners, form.owner_emp_ids])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required')
    if (!form.start_date) return setError('Start date is required')
    if (selectedOwners.length === 0) return setError('At least one owner is required')

    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      start_date: form.start_date,
      end_date: form.end_date || null,
      owner_emp_ids: selectedOwners.map((o) => o.emp_id),
    }

    const request = isEdit
      ? workPackageService.update(Number(wpId), payload)
      : workPackageService.create(payload)

    request
      .then(() => navigate('/work-packages'))
      .catch((e: Error) => { setError(e.message); setSaving(false) })
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/work-packages')}>Back</Button>
        <Typography variant="h5" fontWeight={600}>
          {isEdit ? 'Edit Work Package' : 'New Work Package'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, maxWidth: 680 }} component="form" onSubmit={handleSubmit}>
        <TextField
          label="Name *"
          fullWidth
          sx={{ mb: 2 }}
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Integration, Mobile App, Agent Export"
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={3}
          sx={{ mb: 2 }}
          value={form.description}
          onChange={set('description')}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Start Date *"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.start_date}
            onChange={set('start_date')}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.end_date}
            onChange={set('end_date')}
            inputProps={{ min: form.start_date }}
          />
        </Box>

        <Autocomplete
          multiple
          options={owners}
          getOptionLabel={(o) => `${o.full_name} (${o.role_name})`}
          value={selectedOwners}
          onChange={(_, val) => setSelectedOwners(val)}
          isOptionEqualToValue={(a, b) => a.emp_id === b.emp_id}
          renderTags={(val, getTagProps) =>
            val.map((o, i) => (
              <Chip
                label={`${o.full_name} · ${o.role_name}`}
                size="small"
                color="primary"
                variant="outlined"
                {...getTagProps({ index: i })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Owners * (Platform Owner / Supervisor)"
              placeholder={selectedOwners.length === 0 ? 'Select owners…' : ''}
            />
          )}
          sx={{ mb: 3 }}
          noOptionsText={
            owners.length === 0
              ? 'No employees with Platform Owner or Supervisor role found'
              : 'No options'
          }
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Work Package'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/work-packages')} disabled={saving}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
