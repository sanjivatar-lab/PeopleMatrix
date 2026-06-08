import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress,
  Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import { ArrowBack, Search } from '@mui/icons-material'
import { competencyService } from '../services/competencyService'
import api from '../services/api'
import type { Competency } from '../types'

interface CompetencyRef {
  id: number
  name: string
  category?: string | null
}

interface CompetencyMember {
  emp_id: number
  full_name: string
  email: string
  role: string
  matched_competencies: CompetencyRef[]
  all_competencies: CompetencyRef[]
}

const CATEGORY_COLOR: Record<string, 'primary' | 'success' | 'secondary' | 'warning' | 'info' | 'default'> = {
  AI: 'primary',
  Frontend: 'info',
  Backend: 'success',
  Design: 'secondary',
  Infrastructure: 'warning',
}

export default function CompetencyReport() {
  const navigate = useNavigate()
  const [allComps, setAllComps] = useState<Competency[]>([])
  const [selected, setSelected] = useState<Competency[]>([])
  const [results, setResults] = useState<CompetencyMember[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    competencyService.getAll()
      .then((comps) =>
        setAllComps(
          [...comps].sort((a, b) => {
            const ca = a.category || 'Uncategorized'
            const cb = b.category || 'Uncategorized'
            return ca.localeCompare(cb) || a.name.localeCompare(b.name)
          })
        )
      )
      .catch(() => {})
  }, [])

  const handleSearch = () => {
    if (selected.length === 0) return
    setError('')
    setLoading(true)
    const sp = new URLSearchParams()
    selected.forEach((c) => sp.append('competency_ids', String(c.id)))
    api
      .get<CompetencyMember[]>(`/reports/competency-team-members?${sp.toString()}`)
      .then((r) => setResults(r.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Back</Button>
        <Typography variant="h5" fontWeight={600}>Team Members by Competency</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" mb={1} color="text.secondary">
          Select one or more competencies to find matching team members.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Autocomplete
            multiple
            options={allComps}
            getOptionLabel={(o) => o.name}
            groupBy={(o) => o.category || 'Uncategorized'}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selected}
            onChange={(_, val) => setSelected(val as Competency[])}
            renderInput={(params) => (
              <TextField {...params} label="Competencies" placeholder="Type to filter…" />
            )}
            renderTags={(value, getTagProps) =>
              (value as Competency[]).map((opt, i) => (
                <Chip
                  {...getTagProps({ index: i })}
                  label={opt.name}
                  size="small"
                  color={CATEGORY_COLOR[opt.category || ''] ?? 'default'}
                />
              ))
            }
            sx={{ flex: 1 }}
            disableCloseOnSelect
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
            disabled={selected.length === 0 || loading}
            sx={{ whiteSpace: 'nowrap', height: 56 }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : results !== null && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Results</Typography>
            <Chip label={`${results.length} team member${results.length !== 1 ? 's' : ''}`} size="small" color="primary" />
          </Box>

          {results.length === 0 ? (
            <Alert severity="info">
              No team members found with the selected competenc{selected.length > 1 ? 'ies' : 'y'}.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'primary.dark', color: 'white' } }}>
                    <TableCell>Emp ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Matched Competencies</TableCell>
                    <TableCell>All Competencies</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((row) => (
                    <TableRow key={row.emp_id} hover>
                      <TableCell>{row.emp_id}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{row.full_name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Tooltip title={row.role}>
                          <Chip
                            label={row.role}
                            size="small"
                            color={
                              row.role === 'Team Member' ? 'success' :
                              row.role === 'Supervisor' ? 'secondary' :
                              row.role === 'Platform Owner' ? 'primary' : 'default'
                            }
                            variant={row.role === 'Unassigned' ? 'outlined' : 'filled'}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {row.matched_competencies.map((c) => (
                            <Chip
                              key={c.id}
                              label={c.name}
                              size="small"
                              color={CATEGORY_COLOR[c.category || ''] ?? 'default'}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {row.all_competencies.map((c) => (
                            <Chip
                              key={c.id}
                              label={c.name}
                              size="small"
                              color={CATEGORY_COLOR[c.category || ''] ?? 'default'}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  )
}
