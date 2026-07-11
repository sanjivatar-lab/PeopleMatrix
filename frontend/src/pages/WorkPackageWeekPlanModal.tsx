import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  AccountTree,
  Add,
  Check,
  Close,
  Delete,
  Edit,
  ExpandMore,
  TipsAndUpdates,
} from '@mui/icons-material'
import workPackageService from '../services/workPackageService'
import type { WorkPackage, WorkPackageAssignment, WeekPlan, WeekTask } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const TASK_STATUSES: { value: string; color: 'default' | 'info' | 'success' | 'error' | 'warning' }[] = [
  { value: 'Planned',     color: 'default'  },
  { value: 'In Progress', color: 'info'     },
  { value: 'Done',        color: 'success'  },
  { value: 'Blocked',     color: 'error'    },
]

interface TaskForm {
  description: string
  assigned_emp_id: string
  status: string
  effort_hours: string
  dependency_ids: number[]
}

const EMPTY_TASK: TaskForm = {
  description: '',
  assigned_emp_id: '',
  status: 'Planned',
  effort_hours: '',
  dependency_ids: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMonday(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day))
  return copy
}

function generateWeeks(startDate: string, endDate: string | null | undefined): string[] {
  const start = new Date(startDate + 'T00:00:00')
  const firstMon = toMonday(start)
  const end = endDate
    ? new Date(endDate + 'T00:00:00')
    : new Date(firstMon.getTime() + 12 * 7 * 86_400_000)

  const weeks: string[] = []
  const cur = new Date(firstMon)
  while (cur <= end) {
    weeks.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 7)
  }
  return weeks
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function fmt(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short',
  })
}

function currentWeekMonday(): string {
  return toMonday(new Date()).toISOString().split('T')[0]
}

function statusColor(s: string) {
  return TASK_STATUSES.find((x) => x.value === s)?.color ?? 'default'
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  wp: WorkPackage
  onClose: () => void
}

export default function WorkPackageWeekPlanModal({ wp, onClose }: Props) {
  const [plans, setPlans] = useState<WeekPlan[]>([])
  const [assignments, setAssignments] = useState<WorkPackageAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | false>(currentWeekMonday)
  const [goalDrafts, setGoalDrafts] = useState<Record<string, string>>({})
  const [extDepsDrafts, setExtDepsDrafts] = useState<Record<string, string>>({})
  const [savingGoal, setSavingGoal] = useState<string | false>(false)
  const [addingTaskToWeek, setAddingTaskToWeek] = useState<string | null>(null)
  const [newTask, setNewTask] = useState<TaskForm>(EMPTY_TASK)
  const [submittingTask, setSubmittingTask] = useState(false)
  const [editTaskId, setEditTaskId] = useState<number | null>(null)
  const [editTask, setEditTask] = useState<TaskForm>(EMPTY_TASK)
  const [savingTask, setSavingTask] = useState(false)

  const weeks = useMemo(() => generateWeeks(wp.start_date, wp.end_date), [wp.start_date, wp.end_date])

  const plansByWeek = useMemo(
    () => Object.fromEntries(plans.map((p) => [p.week_start, p])),
    [plans],
  )

  // Flat list of all tasks with week label — used for the dependency selector
  const allTasks = useMemo(() => {
    const result: Array<WeekTask & { weekLabel: string }> = []
    plans.forEach((p) => {
      const weekIdx = weeks.indexOf(p.week_start)
      const label = weekIdx >= 0 ? `Wk ${weekIdx + 1}` : p.week_start
      p.tasks.forEach((t) => result.push({ ...t, weekLabel: label }))
    })
    return result
  }, [plans, weeks])

  const taskById = useMemo(
    () => Object.fromEntries(allTasks.map((t) => [t.id, t])),
    [allTasks],
  )

  useEffect(() => {
    Promise.all([
      workPackageService.getWeekPlans(wp.id),
      workPackageService.getAssignments(wp.id),
    ])
      .then(([ps, as]) => {
        setPlans(ps)
        setAssignments(as)
        const drafts: Record<string, string> = {}
        const extDrafts: Record<string, string> = {}
        ps.forEach((p) => {
          drafts[p.week_start] = p.goal ?? ''
          extDrafts[p.week_start] = p.external_dependencies ?? ''
        })
        setGoalDrafts(drafts)
        setExtDepsDrafts(extDrafts)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [wp.id])

  const handleAccordionChange = (weekStart: string) => {
    setExpanded((prev) => (prev === weekStart ? false : weekStart))
    setAddingTaskToWeek(null)
    setNewTask(EMPTY_TASK)
    setEditTaskId(null)
  }

  const handleSaveGoal = async (weekStart: string) => {
    const goal = (goalDrafts[weekStart] ?? '').trim() || null
    const external_dependencies = (extDepsDrafts[weekStart] ?? '').trim() || null
    setSavingGoal(weekStart)
    try {
      const updated = await workPackageService.upsertWeekPlan(wp.id, { week_start: weekStart, goal, external_dependencies })
      setPlans((prev) => {
        const idx = prev.findIndex((p) => p.week_start === weekStart)
        if (idx >= 0) {
          const next = [...prev]; next[idx] = updated; return next
        }
        return [...prev, updated]
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save goal')
    } finally {
      setSavingGoal(false)
    }
  }

  const ensurePlan = async (weekStart: string): Promise<WeekPlan> => {
    if (plansByWeek[weekStart]) return plansByWeek[weekStart]
    const created = await workPackageService.upsertWeekPlan(wp.id, {
      week_start: weekStart,
      goal: (goalDrafts[weekStart] ?? '').trim() || null,
      external_dependencies: (extDepsDrafts[weekStart] ?? '').trim() || null,
    })
    setPlans((prev) => [...prev, created])
    return created
  }

  const handleAddTask = async (weekStart: string) => {
    if (!newTask.description.trim()) return
    setSubmittingTask(true)
    try {
      const plan = await ensurePlan(weekStart)
      const task = await workPackageService.addWeekTask(wp.id, plan.id, {
        description: newTask.description.trim(),
        assigned_emp_id: newTask.assigned_emp_id ? parseInt(newTask.assigned_emp_id) : null,
        status: newTask.status,
        effort_hours: newTask.effort_hours ? parseFloat(newTask.effort_hours) : null,
        dependency_ids: newTask.dependency_ids,
      })
      setPlans((prev) =>
        prev.map((p) =>
          p.week_start === weekStart ? { ...p, tasks: [...p.tasks, task] } : p,
        ),
      )
      setNewTask(EMPTY_TASK)
      setAddingTaskToWeek(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add task')
    } finally {
      setSubmittingTask(false)
    }
  }

  const startEditTask = (task: WeekTask) => {
    setEditTaskId(task.id)
    setEditTask({
      description: task.description,
      assigned_emp_id: task.assigned_emp_id ? String(task.assigned_emp_id) : '',
      status: task.status,
      effort_hours: task.effort_hours != null ? String(task.effort_hours) : '',
      dependency_ids: task.dependency_ids ?? [],
    })
  }

  const handleSaveTask = async (weekStart: string, taskId: number) => {
    const plan = plansByWeek[weekStart]
    if (!plan) return
    setSavingTask(true)
    try {
      const updated = await workPackageService.updateWeekTask(wp.id, plan.id, taskId, {
        description: editTask.description.trim(),
        assigned_emp_id: editTask.assigned_emp_id ? parseInt(editTask.assigned_emp_id) : null,
        status: editTask.status,
        effort_hours: editTask.effort_hours ? parseFloat(editTask.effort_hours) : null,
        dependency_ids: editTask.dependency_ids,
      })
      setPlans((prev) =>
        prev.map((p) =>
          p.week_start === weekStart
            ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? updated : t)) }
            : p,
        ),
      )
      setEditTaskId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save task')
    } finally {
      setSavingTask(false)
    }
  }

  const handleDeleteTask = async (weekStart: string, taskId: number) => {
    const plan = plansByWeek[weekStart]
    if (!plan) return
    try {
      await workPackageService.deleteWeekTask(wp.id, plan.id, taskId)
      setPlans((prev) =>
        prev.map((p) =>
          p.week_start === weekStart
            ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
            : p,
        ),
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  // Dependency multi-select — shared between add and edit forms
  const DependencySelect = ({
    value,
    onChange,
    excludeId,
  }: {
    value: number[]
    onChange: (ids: number[]) => void
    excludeId?: number
  }) => {
    const options = allTasks.filter((t) => t.id !== excludeId)
    if (options.length === 0) return null
    return (
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel shrink>Depends On</InputLabel>
        <Select
          label="Depends On"
          multiple
          displayEmpty
          value={value}
          onChange={(e) => onChange(e.target.value as number[])}
          renderValue={(selected) => {
            const ids = selected as number[]
            if (ids.length === 0)
              return <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.85rem' }}>None</Typography>
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                {ids.map((id) => {
                  const dep = taskById[id]
                  return dep ? (
                    <Chip
                      key={id}
                      label={`${dep.weekLabel}: ${truncate(dep.description, 18)}`}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  ) : null
                })}
              </Box>
            )
          }}
        >
          {options.map((t) => (
            <MenuItem key={t.id} value={t.id} dense>
              <Checkbox size="small" checked={value.includes(t.id)} />
              <ListItemText
                primary={`${t.weekLabel}: ${truncate(t.description, 40)}`}
                secondary={t.status}
                primaryTypographyProps={{ fontSize: '0.8rem' }}
                secondaryTypographyProps={{ fontSize: '0.72rem' }}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  const curWeek = currentWeekMonday()

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '92vh' } }}>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" component="div">Week-wise Plan</Typography>
        <Typography variant="body2" color="text.secondary">
          {wp.name}&nbsp;&nbsp;·&nbsp;&nbsp;{fmt(wp.start_date)} – {wp.end_date ? fmt(wp.end_date) : 'Ongoing'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, overflowX: 'hidden' }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Alert
            severity="info"
            icon={<TipsAndUpdates fontSize="small" />}
            sx={{ '& .MuiAlert-message': { width: '100%' } }}
          >
            <AlertTitle sx={{ mb: 0.5, fontSize: '0.85rem' }}>Industry Best Practices</AlertTitle>
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.25 }}>
              {[
                '📌 Set a clear weekly goal (sprint goal)',
                '🔨 Break tasks to < 1 day each',
                '👤 One owner per task for accountability',
                '⏱ Estimate hours to track capacity',
                '🔗 Define dependencies to surface blockers early',
                '🚧 Flag Blocked tasks immediately',
              ].map((tip) => (
                <Chip key={tip} label={tip} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              ))}
            </Stack>
          </Alert>
        </Box>

        {error && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ px: 2, pb: 2 }}>
            {weeks.map((weekStart, idx) => {
              const weekEnd = addDays(weekStart, 6)
              const plan = plansByWeek[weekStart]
              const taskCount = plan?.tasks.length ?? 0
              const doneCount = plan?.tasks.filter((t) => t.status === 'Done').length ?? 0
              const blockedCount = plan?.tasks.filter((t) => t.status === 'Blocked').length ?? 0
              const inProgressCount = plan?.tasks.filter((t) => t.status === 'In Progress').length ?? 0
              const isExpanded = expanded === weekStart
              const goalDraft = goalDrafts[weekStart] ?? plan?.goal ?? ''
              const goalSaved = plan?.goal ?? ''
              const extDepDraft = extDepsDrafts[weekStart] ?? plan?.external_dependencies ?? ''
              const extDepSaved = plan?.external_dependencies ?? ''
              const planChanged =
                goalDraft.trim() !== goalSaved.trim() ||
                extDepDraft.trim() !== extDepSaved.trim()
              const isCurrentWeek = weekStart === curWeek

              return (
                <Accordion
                  key={weekStart}
                  expanded={isExpanded}
                  onChange={() => handleAccordionChange(weekStart)}
                  disableGutters
                  sx={{
                    mb: 1,
                    border: '1px solid',
                    borderColor: isCurrentWeek ? 'primary.light' : 'divider',
                    borderRadius: '8px !important',
                    '&:before': { display: 'none' },
                    bgcolor: isCurrentWeek && !isExpanded ? 'primary.50' : undefined,
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 52 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, mr: 1, minWidth: 0 }}>
                      <Chip
                        label={`Wk ${idx + 1}`}
                        size="small"
                        variant={plan ? 'filled' : 'outlined'}
                        sx={{ minWidth: 50, fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}
                      />
                      {isCurrentWeek && (
                        <Chip label="Current" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 18 }} />
                      )}
                      <Typography variant="body2" fontWeight={500} sx={{ flexShrink: 0 }}>
                        {fmt(weekStart)} – {fmt(weekEnd)}
                      </Typography>
                      {plan?.goal && !isExpanded && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ flex: 1, fontStyle: 'italic', minWidth: 0 }}
                        >
                          {plan.goal}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={0.5} sx={{ ml: 'auto', flexShrink: 0 }}>
                        {taskCount > 0 && (
                          <Chip label={`${doneCount}/${taskCount} done`} size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem' }} />
                        )}
                        {blockedCount > 0 && (
                          <Chip label={`${blockedCount} blocked`} size="small" color="error" sx={{ fontSize: '0.68rem' }} />
                        )}
                        {inProgressCount > 0 && (
                          <Chip label={`${inProgressCount} active`} size="small" color="info" variant="outlined" sx={{ fontSize: '0.68rem' }} />
                        )}
                      </Stack>
                    </Stack>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                    <Divider sx={{ mb: 2 }} />

                    {/* Weekly Goal + External Dependencies */}
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          label="Weekly Goal / Sprint Objective"
                          placeholder="e.g. Complete API endpoints and unit tests for the user module"
                          value={goalDraft}
                          onChange={(e) => setGoalDrafts((d) => ({ ...d, [weekStart]: e.target.value }))}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSaveGoal(weekStart)}
                          disabled={savingGoal === weekStart || !planChanged}
                          startIcon={savingGoal === weekStart ? <CircularProgress size={14} /> : <Check />}
                          sx={{ whiteSpace: 'nowrap', minWidth: 80, alignSelf: 'flex-start' }}
                        >
                          Save
                        </Button>
                      </Stack>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        label="External Dependencies"
                        placeholder="e.g. Waiting for API spec from Client XYZ · Vendor delivery of module v2.1 expected by Wed · Sign-off from Legal team"
                        value={extDepDraft}
                        onChange={(e) => setExtDepsDrafts((d) => ({ ...d, [weekStart]: e.target.value }))}
                      />
                    </Stack>

                    {/* Tasks table */}
                    {taskCount > 0 && (
                      <Box sx={{ overflowX: 'auto', mb: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Task</TableCell>
                              <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Assignee</TableCell>
                              <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 600, minWidth: 70 }}>Hours</TableCell>
                              <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>
                                <Stack direction="row" alignItems="center" gap={0.5}>
                                  <AccountTree sx={{ fontSize: 14 }} />
                                  Dependencies
                                </Stack>
                              </TableCell>
                              <TableCell sx={{ width: 80 }} />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {plan!.tasks.map((task) =>
                              editTaskId === task.id ? (
                                // ── Edit row ─────────────────────────────────
                                <TableRow key={task.id}>
                                  <TableCell>
                                    <TextField
                                      size="small" fullWidth autoFocus
                                      value={editTask.description}
                                      onChange={(e) => setEditTask((t) => ({ ...t, description: e.target.value }))}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      size="small" fullWidth
                                      value={editTask.assigned_emp_id}
                                      onChange={(e) => setEditTask((t) => ({ ...t, assigned_emp_id: e.target.value }))}
                                    >
                                      <MenuItem value=""><em>Unassigned</em></MenuItem>
                                      {assignments.map((a) => (
                                        <MenuItem key={a.emp_id} value={String(a.emp_id)}>{a.employee_name}</MenuItem>
                                      ))}
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      size="small" fullWidth
                                      value={editTask.status}
                                      onChange={(e) => setEditTask((t) => ({ ...t, status: e.target.value }))}
                                    >
                                      {TASK_STATUSES.map((s) => (
                                        <MenuItem key={s.value} value={s.value}>{s.value}</MenuItem>
                                      ))}
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      size="small" type="number" sx={{ width: 70 }}
                                      value={editTask.effort_hours}
                                      onChange={(e) => setEditTask((t) => ({ ...t, effort_hours: e.target.value }))}
                                      inputProps={{ min: 0, step: 0.5 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <DependencySelect
                                      value={editTask.dependency_ids}
                                      onChange={(ids) => setEditTask((t) => ({ ...t, dependency_ids: ids }))}
                                      excludeId={task.id}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Tooltip title="Save">
                                      <IconButton size="small" color="primary"
                                        onClick={() => handleSaveTask(weekStart, task.id)} disabled={savingTask}>
                                        <Check fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cancel">
                                      <IconButton size="small" onClick={() => setEditTaskId(null)}>
                                        <Close fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                // ── View row ─────────────────────────────────
                                <TableRow key={task.id} hover sx={{ '&:hover .task-actions': { visibility: 'visible' } }}>
                                  <TableCell>{task.description}</TableCell>
                                  <TableCell>
                                    {task.assignee_name ?? (
                                      <Typography variant="body2" color="text.disabled" component="span">Unassigned</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={task.status} size="small" color={statusColor(task.status)} />
                                  </TableCell>
                                  <TableCell>
                                    {task.effort_hours != null ? `${task.effort_hours}h` : '—'}
                                  </TableCell>
                                  <TableCell>
                                    {(task.dependency_ids ?? []).length === 0 ? (
                                      <Typography variant="body2" color="text.disabled">—</Typography>
                                    ) : (
                                      <Stack spacing={0.25}>
                                        {task.dependency_ids.map((depId) => {
                                          const dep = taskById[depId]
                                          if (!dep) return null
                                          const depDone = dep.status === 'Done'
                                          const depBlocked = dep.status === 'Blocked'
                                          return (
                                            <Tooltip
                                              key={depId}
                                              title={`${dep.weekLabel}: ${dep.description} [${dep.status}]`}
                                            >
                                              <Chip
                                                icon={<AccountTree sx={{ fontSize: '10px !important' }} />}
                                                label={`${dep.weekLabel}: ${truncate(dep.description, 22)}`}
                                                size="small"
                                                color={depDone ? 'success' : depBlocked ? 'error' : 'default'}
                                                variant={depDone ? 'filled' : 'outlined'}
                                                sx={{ fontSize: '0.65rem', height: 20 }}
                                              />
                                            </Tooltip>
                                          )
                                        })}
                                      </Stack>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" className="task-actions" sx={{ visibility: 'hidden', justifyContent: 'flex-end' }}>
                                      <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => startEditTask(task)}>
                                          <Edit fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete">
                                        <IconButton size="small" color="error" onClick={() => handleDeleteTask(weekStart, task.id)}>
                                          <Delete fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    )}

                    {/* Add Task form */}
                    {addingTaskToWeek === weekStart ? (
                      <Box sx={{ border: '1px dashed', borderColor: 'primary.light', borderRadius: 1, p: 1.5, mt: taskCount > 0 ? 0.5 : 0 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" gap={1}>
                          <TextField
                            size="small"
                            label="Task description"
                            placeholder="What needs to be done this week?"
                            autoFocus
                            sx={{ flex: '1 1 200px' }}
                            value={newTask.description}
                            onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(weekStart) }}
                          />
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Assignee</InputLabel>
                            <Select
                              label="Assignee"
                              value={newTask.assigned_emp_id}
                              onChange={(e) => setNewTask((t) => ({ ...t, assigned_emp_id: e.target.value }))}
                            >
                              <MenuItem value=""><em>Unassigned</em></MenuItem>
                              {assignments.map((a) => (
                                <MenuItem key={a.emp_id} value={String(a.emp_id)}>{a.employee_name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                              label="Status"
                              value={newTask.status}
                              onChange={(e) => setNewTask((t) => ({ ...t, status: e.target.value }))}
                            >
                              {TASK_STATUSES.map((s) => (
                                <MenuItem key={s.value} value={s.value}>{s.value}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            size="small" label="Hours" type="number" sx={{ width: 85 }}
                            value={newTask.effort_hours}
                            onChange={(e) => setNewTask((t) => ({ ...t, effort_hours: e.target.value }))}
                            inputProps={{ min: 0, step: 0.5 }}
                          />
                          <DependencySelect
                            value={newTask.dependency_ids}
                            onChange={(ids) => setNewTask((t) => ({ ...t, dependency_ids: ids }))}
                          />
                          <Button
                            variant="contained" size="small"
                            startIcon={submittingTask ? <CircularProgress size={14} color="inherit" /> : <Add />}
                            onClick={() => handleAddTask(weekStart)}
                            disabled={!newTask.description.trim() || submittingTask}
                          >
                            Add
                          </Button>
                          <IconButton size="small" onClick={() => { setAddingTaskToWeek(null); setNewTask(EMPTY_TASK) }}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    ) : (
                      <Button
                        size="small" startIcon={<Add />} variant="outlined"
                        onClick={() => { setAddingTaskToWeek(weekStart); setNewTask(EMPTY_TASK) }}
                        sx={{ mt: taskCount > 0 ? 0.5 : 0 }}
                      >
                        Add Task
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
              )
            })}

            {weeks.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No weeks in the work package date range.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
