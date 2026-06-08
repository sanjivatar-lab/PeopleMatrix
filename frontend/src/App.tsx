import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { createTheme, ThemeProvider } from '@mui/material'
import Layout from './components/Layout'
import EmployeeList from './pages/EmployeeList'
import EmployeeForm from './pages/EmployeeForm'
import BulkUpload from './pages/BulkUpload'
import RoleAssignment from './pages/RoleAssignment'
import SupervisorMapping from './pages/SupervisorMapping'
import CompetencyManagement from './pages/CompetencyManagement'
import WorkPackageList from './pages/WorkPackageList'
import WorkPackageForm from './pages/WorkPackageForm'
import WorkPackageAssignments from './pages/WorkPackageAssignments'
import ReportsDashboard from './pages/ReportsDashboard'
import UnassignedTeamMembers from './pages/UnassignedTeamMembers'
import EmployeesWithoutSupervisor from './pages/EmployeesWithoutSupervisor'
import SupervisorTeamSummary from './pages/SupervisorTeamSummary'
import CompetencyReport from './pages/CompetencyReport'

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#7b1fa2' },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { defaultProps: { elevation: 1 } },
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/employees" replace />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/new" element={<EmployeeForm />} />
            <Route path="employees/:empId/edit" element={<EmployeeForm />} />
            <Route path="bulk-upload" element={<BulkUpload />} />
            <Route path="roles" element={<RoleAssignment />} />
            <Route path="supervisors" element={<SupervisorMapping />} />
            <Route path="competencies" element={<CompetencyManagement />} />
            <Route path="work-packages" element={<WorkPackageList />} />
            <Route path="work-packages/new" element={<WorkPackageForm />} />
            <Route path="work-packages/:wpId/edit" element={<WorkPackageForm />} />
            <Route path="work-packages/:wpId/assignments" element={<WorkPackageAssignments />} />
            <Route path="reports" element={<ReportsDashboard />} />
            <Route path="reports/unassigned-team-members" element={<UnassignedTeamMembers />} />
            <Route path="reports/employees-without-supervisor" element={<EmployeesWithoutSupervisor />} />
            <Route path="reports/supervisor-team-summary" element={<SupervisorTeamSummary />} />
            <Route path="reports/competency-team-members" element={<CompetencyReport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
