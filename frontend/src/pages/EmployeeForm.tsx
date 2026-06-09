import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Box, Button, CircularProgress, FormControl, Grid, InputLabel,
  MenuItem, Paper, Select, TextField, Typography,
} from '@mui/material'
import { ArrowBack, Save } from '@mui/icons-material'
import { employeeService } from '../services/employeeService'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

interface FormState {
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  native_place: string
  years_of_experience: string
  blood_group: string
}

const EMPTY: FormState = {
  first_name: '', last_name: '', email: '',
  mobile_number: '', native_place: '', years_of_experience: '0',
  blood_group: '',
}

type Errors = Partial<Record<keyof FormState, string>>

export default function EmployeeForm() {
  const { empId } = useParams<{ empId: string }>()
  const navigate = useNavigate()
  const isEdit = !!empId

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    employeeService.getById(parseInt(empId!))
      .then((emp) => {
        setForm({
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
          mobile_number: emp.mobile_number || '',
          native_place: emp.native_place || '',
          years_of_experience: String(emp.years_of_experience),
          blood_group: emp.blood_group || '',
        })
      })
      .catch((e: Error) => setSubmitError(e.message))
      .finally(() => setLoading(false))
  }, [empId, isEdit])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = (): boolean => {
    const errs: Errors = {}
    if (!form.first_name.trim()) errs.first_name = 'Required'
    if (!form.last_name.trim()) errs.last_name = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    const exp = parseFloat(form.years_of_experience)
    if (isNaN(exp) || exp < 0) errs.years_of_experience = 'Must be ≥ 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSubmitError('')

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      mobile_number: form.mobile_number.trim() || undefined,
      native_place: form.native_place.trim() || undefined,
      years_of_experience: parseFloat(form.years_of_experience),
      blood_group: form.blood_group || undefined,
    }

    try {
      if (isEdit) {
        await employeeService.update(parseInt(empId!), payload)
      } else {
        await employeeService.create(payload)
      }
      navigate('/employees')
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/employees')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, maxWidth: 700 }}>
        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required label="First Name"
                value={form.first_name} onChange={set('first_name')}
                error={!!errors.first_name} helperText={errors.first_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required label="Last Name"
                value={form.last_name} onChange={set('last_name')}
                error={!!errors.last_name} helperText={errors.last_name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth required label="Email" type="email"
                value={form.email} onChange={set('email')}
                error={!!errors.email} helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Mobile Number"
                value={form.mobile_number} onChange={set('mobile_number')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Native Place"
                value={form.native_place} onChange={set('native_place')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required label="Years of Experience" type="number"
                inputProps={{ min: 0, step: 0.5 }}
                value={form.years_of_experience} onChange={set('years_of_experience')}
                error={!!errors.years_of_experience} helperText={errors.years_of_experience}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Blood Group</InputLabel>
                <Select
                  value={form.blood_group}
                  label="Blood Group"
                  onChange={(e) => setForm((prev) => ({ ...prev, blood_group: e.target.value }))}
                >
                  <MenuItem value=""><em>Not specified</em></MenuItem>
                  {BLOOD_GROUPS.map((bg) => (
                    <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button
                  type="submit" variant="contained" disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
                >
                  {isEdit ? 'Update' : 'Create'} Employee
                </Button>
                <Button variant="outlined" onClick={() => navigate('/employees')}>Cancel</Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}
