import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  ArrowBack,
  Assessment,
  Assignment,
  Block,
  CheckCircle,
  Event,
  Groups,
  Link,
  LocalOffer,
  Person,
  Print,
  Schedule,
  TrendingUp,
  Warning,
} from '@mui/icons-material'
import api from '../services/api'
import workPackageService from '../services/workPackageService'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WpOwner { emp_id: number; full_name: string }

interface WpAssignment {
  emp_id: number; full_name: string
  start_date: string; end_date: string | null; is_active: boolean
}

interface WpActivity { id: number; description: string; status: string; created_at: string }

interface WpBlocker {
  id: number; description: string; status: string
  raised_on: string | null; resolved_on: string | null
}

interface WpWeekTask {
  id: number; description: string; assignee_name: string | null
  status: string; effort_hours: number | null; dependency_ids: number[]
}

interface TaskCounts {
  total: number; done: number; in_progress: number; blocked: number; planned: number
}

interface WpWeekPlan {
  id: number; week_start: string; goal: string | null; external_dependencies: string | null
  tasks: WpWeekTask[]; task_counts: TaskCounts
}

interface SummaryStats {
  total_tasks: number; done_tasks: number; blocked_tasks: number
  total_effort_hours: number; done_effort_hours: number
  open_blockers: number; total_activities: number; done_activities: number
  active_members: number
}

interface WpReport {
  id: number; name: string; description: string | null; status: string | null
  start_date: string; end_date: string | null
  owners: WpOwner[]; assignments: WpAssignment[]
  activities: WpActivity[]; blockers: WpBlocker[]
  week_plans: WpWeekPlan[]; summary_stats: SummaryStats
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function addDays(d: string, n: number) {
  const dt = new Date(d + 'T00:00:00')
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

const WP_STATUS_COLOR: Record<string, string> = {
  'Not Started': '#757575',
  'In Progress': '#1565c0',
  'On Hold':     '#e65100',
  'Completed':   '#2e7d32',
  'Cancelled':   '#b71c1c',
  'At Risk':     '#f57f17',
}

const TASK_STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'error'> = {
  'Planned':     'default',
  'In Progress': 'info',
  'Done':        'success',
  'Blocked':     'error',
}

const ACTIVITY_STATUS_COLOR: Record<string, 'default' | 'info' | 'success'> = {
  'To Do':       'default',
  'In Progress': 'info',
  'Done':        'success',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, subtitle, icon, color, progress,
}: {
  label: string; value: string | number; subtitle?: string
  icon: React.ReactNode; color: string; progress?: number
}) {
  return (
    <Card sx={{ flex: '1 1 200px', borderTop: `4px solid ${color}` }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography
              variant="caption" color="text.secondary" fontWeight={700}
              textTransform="uppercase" letterSpacing={0.8} display="block"
            >
              {label}
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color, lineHeight: 1.1, mt: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.6, mt: 0.5 }}>{icon}</Box>
        </Stack>
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1.5, borderRadius: 4, height: 7, bgcolor: 'grey.100',
              '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  icon, title, count,
}: {
  icon: React.ReactNode; title: string; count?: number
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
      {count !== undefined && (
        <Chip label={count} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
      )}
    </Stack>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkPackageReport() {
  const navigate = useNavigate()
  const [wpOptions, setWpOptions] = useState<{ id: number; name: string }[]>([])
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [report, setReport] = useState<WpReport | null>(null)
  const [loadingWps, setLoadingWps] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    workPackageService.getAll()
      .then((wps) => setWpOptions(wps.map((w) => ({ id: w.id, name: w.name }))))
      .catch(() => {})
      .finally(() => setLoadingWps(false))
  }, [])

  useEffect(() => {
    if (!selectedId) { setReport(null); return }
    setLoading(true)
    setError('')
    api.get(`/reports/work-package/${selectedId}`)
      .then((r) => setReport(r.data as WpReport))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  const stats = report?.summary_stats
  const taskPct  = stats ? pct(stats.done_tasks, stats.total_tasks) : 0
  const effortPct = stats ? pct(stats.done_effort_hours, stats.total_effort_hours) : 0
  const activityPct = stats ? pct(stats.done_activities, stats.total_activities) : 0
  const wpStatusColor = WP_STATUS_COLOR[report?.status ?? ''] ?? '#bdbdbd'

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Reports</Button>
          <Typography variant="h5" fontWeight={600}>Work Package Report</Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 300 }}>
            <InputLabel>Select Work Package</InputLabel>
            <Select
              label="Select Work Package"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value as number)}
              disabled={loadingWps}
            >
              {wpOptions.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {report && (
            <Tooltip title="Print / Export as PDF">
              <Button variant="outlined" size="small" startIcon={<Print />} onClick={() => window.print()}>
                Print
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!selectedId && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Assessment sx={{ fontSize: 56, opacity: 0.25, mb: 1.5 }} />
          <Typography variant="h6" gutterBottom fontWeight={600}>Select a Work Package</Typography>
          <Typography variant="body2">
            Choose a work package from the dropdown above to generate its comprehensive report.
          </Typography>
        </Paper>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Report body ─────────────────────────────────────────────────── */}
      {report && !loading && (
        <Stack spacing={3}>

          {/* 1 ─ WP Overview ────────────────────────────────────────────── */}
          <Paper sx={{ p: 3, borderLeft: `6px solid ${wpStatusColor}` }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mb: 0.75 }}>
                  <Typography variant="h5" fontWeight={800}>{report.name}</Typography>
                  {report.status && (
                    <Chip
                      label={report.status}
                      size="small"
                      sx={{ bgcolor: wpStatusColor, color: 'white', fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  )}
                </Stack>
                {report.description && (
                  <Typography variant="body2" color="text.secondary">{report.description}</Typography>
                )}
                {report.owners.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center' }}>Owners:</Typography>
                    {report.owners.map((o) => (
                      <Chip
                        key={o.emp_id}
                        icon={<Person sx={{ fontSize: '14px !important' }} />}
                        label={o.full_name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
                  <Event sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {fmt(report.start_date)} – {report.end_date ? fmt(report.end_date) : 'Ongoing'}
                  </Typography>
                </Stack>
                {report.end_date && (
                  <Typography variant="caption" color="text.disabled">
                    {Math.ceil((new Date(report.end_date + 'T00:00:00').getTime() - Date.now()) / 86_400_000)} days remaining
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>

          {/* 2 ─ KPI Cards ──────────────────────────────────────────────── */}
          <Stack direction="row" flexWrap="wrap" gap={2}>
            <KpiCard
              label="Task Completion"
              value={`${taskPct}%`}
              subtitle={`${stats!.done_tasks} of ${stats!.total_tasks} tasks done`}
              icon={<CheckCircle sx={{ fontSize: 36 }} />}
              color="#2e7d32"
              progress={taskPct}
            />
            <KpiCard
              label="Effort Burn"
              value={`${stats!.done_effort_hours}h`}
              subtitle={`of ${stats!.total_effort_hours}h estimated · ${effortPct}% burned`}
              icon={<TrendingUp sx={{ fontSize: 36 }} />}
              color="#1565c0"
              progress={effortPct}
            />
            <KpiCard
              label="Open Blockers"
              value={stats!.open_blockers}
              subtitle={`${stats!.blocked_tasks} task(s) currently blocked`}
              icon={<Block sx={{ fontSize: 36 }} />}
              color={stats!.open_blockers > 0 ? '#b71c1c' : '#2e7d32'}
            />
            <KpiCard
              label="Activity Progress"
              value={`${activityPct}%`}
              subtitle={`${stats!.done_activities} of ${stats!.total_activities} activities done`}
              icon={<Assignment sx={{ fontSize: 36 }} />}
              color="#7b1fa2"
              progress={activityPct}
            />
          </Stack>

          {/* 3 ─ Team Assignments ───────────────────────────────────────── */}
          <Paper sx={{ p: 2.5 }}>
            <SectionHeader icon={<Groups />} title="Team Assignments" count={report.assignments.length} />
            {report.assignments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No team members assigned yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {['Member', 'From', 'To', 'Status'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.assignments.map((a) => (
                      <TableRow key={a.emp_id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{a.full_name}</TableCell>
                        <TableCell>{fmt(a.start_date)}</TableCell>
                        <TableCell>
                          {a.end_date ? fmt(a.end_date) : (
                            <Typography variant="body2" color="text.disabled" fontStyle="italic">Ongoing</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={a.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={a.is_active ? 'success' : 'default'}
                            variant={a.is_active ? 'filled' : 'outlined'}
                            sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* 4 ─ Week-wise Execution Plan ───────────────────────────────── */}
          <Paper sx={{ p: 2.5 }}>
            <SectionHeader icon={<Schedule />} title="Week-wise Execution Plan" count={report.week_plans.length} />
            {report.week_plans.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No week plans defined yet.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {report.week_plans.map((plan, idx) => {
                  const weekEnd = addDays(plan.week_start, 6)
                  const weekPct = pct(plan.task_counts.done, plan.task_counts.total)
                  const allDone = plan.task_counts.total > 0 && plan.task_counts.done === plan.task_counts.total
                  return (
                    <Box
                      key={plan.id}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}
                    >
                      {/* Week header bar */}
                      <Box sx={{ px: 2, py: 1.5, bgcolor: allDone ? 'success.50' : 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip
                              label={`Wk ${idx + 1}`}
                              size="small"
                              color={allDone ? 'success' : 'primary'}
                              sx={{ fontWeight: 700, fontSize: '0.72rem', minWidth: 50 }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {fmt(plan.week_start)} – {fmt(weekEnd)}
                            </Typography>
                          </Stack>

                          {plan.task_counts.total > 0 && (
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: '1 1 200px', maxWidth: 340 }}>
                              <LinearProgress
                                variant="determinate"
                                value={weekPct}
                                sx={{
                                  flex: 1, height: 7, borderRadius: 4, bgcolor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: allDone ? '#2e7d32' : '#1565c0', borderRadius: 4,
                                  },
                                }}
                              />
                              <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
                                {plan.task_counts.done}/{plan.task_counts.total}
                              </Typography>
                              {plan.task_counts.blocked > 0 && (
                                <Chip
                                  label={`${plan.task_counts.blocked} blocked`}
                                  size="small" color="error"
                                  sx={{ fontSize: '0.62rem', height: 18 }}
                                />
                              )}
                              {plan.task_counts.in_progress > 0 && (
                                <Chip
                                  label={`${plan.task_counts.in_progress} active`}
                                  size="small" color="info" variant="outlined"
                                  sx={{ fontSize: '0.62rem', height: 18 }}
                                />
                              )}
                            </Stack>
                          )}
                        </Stack>
                      </Box>

                      {/* Goal + External dependencies */}
                      {(plan.goal || plan.external_dependencies) && (
                        <Box sx={{ px: 2, pt: 1.5, pb: plan.tasks.length > 0 ? 1 : 1.5 }}>
                          {plan.goal && (
                            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: plan.external_dependencies ? 1 : 0 }}>
                              <LocalOffer sx={{ fontSize: 14, color: 'primary.main', mt: '3px', flexShrink: 0 }} />
                              <Typography variant="body2" fontWeight={500}>{plan.goal}</Typography>
                            </Stack>
                          )}
                          {plan.external_dependencies && (
                            <Box sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 1, px: 1.5, py: 1 }}>
                              <Stack direction="row" spacing={0.75} alignItems="flex-start">
                                <Link sx={{ fontSize: 14, color: 'warning.dark', mt: '2px', flexShrink: 0 }} />
                                <Box>
                                  <Typography variant="caption" color="warning.dark" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                                    External Dependencies
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                    {plan.external_dependencies}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Task table */}
                      {plan.tasks.length > 0 && (
                        <TableContainer sx={{ px: 2, pb: 1.5, pt: plan.goal || plan.external_dependencies ? 0.5 : 1.5 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {['Task', 'Assignee', 'Status', 'Hours'].map((h) => (
                                  <TableCell
                                    key={h}
                                    sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem',
                                      textTransform: 'uppercase', letterSpacing: 0.5,
                                      pl: h === 'Task' ? 0 : undefined }}
                                  >
                                    {h}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {plan.tasks.map((task) => (
                                <TableRow
                                  key={task.id}
                                  sx={{ opacity: task.status === 'Done' ? 0.65 : 1 }}
                                >
                                  <TableCell sx={{ pl: 0, maxWidth: 340 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                                        color: task.status === 'Done' ? 'text.secondary' : 'inherit',
                                      }}
                                    >
                                      {task.description}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {task.assignee_name ?? (
                                      <Typography variant="body2" color="text.disabled" fontStyle="italic">Unassigned</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={task.status}
                                      size="small"
                                      color={TASK_STATUS_COLOR[task.status] ?? 'default'}
                                      sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {task.effort_hours != null ? `${task.effort_hours}h` : '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      {plan.tasks.length === 0 && !plan.goal && !plan.external_dependencies && (
                        <Typography variant="body2" color="text.disabled" fontStyle="italic" sx={{ px: 2, py: 1.5 }}>
                          No details recorded for this week.
                        </Typography>
                      )}
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Paper>

          {/* 5 ─ Activities + Blockers (side-by-side on wide screens) ──── */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">

            {/* Activities */}
            <Paper sx={{ p: 2.5, flex: 1 }}>
              <SectionHeader icon={<Assignment />} title="Activities" count={report.activities.length} />
              {report.activities.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No activities recorded.
                </Typography>
              ) : (
                <Stack spacing={0}>
                  {report.activities.map((a, i) => (
                    <Box
                      key={a.id}
                      sx={{
                        display: 'flex', alignItems: 'flex-start', gap: 1.5,
                        py: 1, borderBottom: i < report.activities.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Chip
                        label={a.status}
                        size="small"
                        color={ACTIVITY_STATUS_COLOR[a.status] ?? 'default'}
                        sx={{ fontSize: '0.65rem', flexShrink: 0, minWidth: 82, justifyContent: 'center', mt: '1px' }}
                      />
                      <Typography variant="body2">{a.description}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* Blockers */}
            <Paper sx={{ p: 2.5, flex: 1 }}>
              <SectionHeader icon={<Warning />} title="Blockers" count={report.blockers.length} />
              {report.blockers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No blockers recorded.
                </Typography>
              ) : (
                <Stack spacing={0}>
                  {report.blockers.map((b, i) => (
                    <Box
                      key={b.id}
                      sx={{
                        py: 1, borderBottom: i < report.blockers.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                        <Typography variant="body2" sx={{ flex: 1 }}>{b.description}</Typography>
                        <Chip
                          label={b.status}
                          size="small"
                          color={b.status === 'Open' ? 'error' : 'success'}
                          sx={{ fontSize: '0.65rem', fontWeight: 600, flexShrink: 0 }}
                        />
                      </Stack>
                      {(b.raised_on || b.resolved_on) && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
                          {b.raised_on && `Raised: ${fmt(b.raised_on)}`}
                          {b.raised_on && b.resolved_on && ' · '}
                          {b.resolved_on && `Resolved: ${fmt(b.resolved_on)}`}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
