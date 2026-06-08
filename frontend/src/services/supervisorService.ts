import api from './api'
import type { SupervisorMapping } from '../types'

export const supervisorService = {
  assign: (
    employeeEmpId: number,
    supervisorEmpId: number,
    startDate: string,
  ): Promise<SupervisorMapping> =>
    api
      .post('/supervisor/assign', {
        employee_emp_id: employeeEmpId,
        supervisor_emp_id: supervisorEmpId,
        start_date: startDate,
      })
      .then((r) => r.data),

  getHistory: (empId: number): Promise<SupervisorMapping[]> =>
    api.get(`/supervisor/${empId}`).then((r) => r.data),

  getTeam: (supervisorEmpId: number): Promise<SupervisorMapping[]> =>
    api.get(`/supervisor/team/${supervisorEmpId}`).then((r) => r.data),
}
