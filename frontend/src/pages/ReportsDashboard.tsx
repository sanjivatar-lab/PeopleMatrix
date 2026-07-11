import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardActionArea, CardContent, Typography,
} from '@mui/material'
import { AccountTree, Assessment, Groups, PersonOff, Psychology } from '@mui/icons-material'

const REPORTS = [
  {
    path: '/reports/work-package',
    title: 'Work Package Detail Report',
    description:
      'Comprehensive report for any work package: KPI summary, team assignments, week-wise execution plan with tasks, activities, and blockers.',
    icon: <Assessment sx={{ fontSize: 40 }} color="info" />,
  },
  {
    path: '/reports/unassigned-team-members',
    title: 'Unassigned Team Members',
    description:
      'Lists all Team Members who are not currently assigned to any Work Package. Assign them directly from this view.',
    icon: <PersonOff sx={{ fontSize: 40 }} color="primary" />,
  },
  {
    path: '/reports/employees-without-supervisor',
    title: 'Employees Without Supervisor',
    description:
      'Lists all employees who have no current supervisor mapping. Tag them with a supervisor directly from this view.',
    icon: <AccountTree sx={{ fontSize: 40 }} color="secondary" />,
  },
  {
    path: '/reports/supervisor-team-summary',
    title: 'Supervisor Team Summary',
    description:
      'Shows each supervisor with their team member count. Click the count to drill down into the full team list.',
    icon: <Groups sx={{ fontSize: 40 }} color="success" />,
  },
  {
    path: '/reports/competency-team-members',
    title: 'Team Members by Competency',
    description:
      'Search by one or more competencies to see which team members have them. Shows matched and all competencies per member.',
    icon: <Psychology sx={{ fontSize: 40 }} color="warning" />,
  },
]

export default function ReportsDashboard() {
  const navigate = useNavigate()

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Reports
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {REPORTS.map((r) => (
          <Card
            key={r.path}
            sx={{ width: 280, borderTop: '4px solid', borderColor: 'primary.main' }}
          >
            <CardActionArea onClick={() => navigate(r.path)} sx={{ p: 2, height: '100%' }}>
              <CardContent>
                <Box mb={1}>{r.icon}</Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {r.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
