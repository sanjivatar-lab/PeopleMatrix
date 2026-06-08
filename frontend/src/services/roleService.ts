import api from './api'
import type { Role, EmployeeRole } from '../types'

export const roleService = {
  getAll: (): Promise<Role[]> => api.get('/roles/').then((r) => r.data),

  assignRole: (empId: number, roleId: number): Promise<EmployeeRole> =>
    api.post('/roles/assign', { emp_id: empId, role_id: roleId }).then((r) => r.data),

  getEmployeeRole: (empId: number): Promise<EmployeeRole | null> =>
    api.get(`/roles/employee/${empId}`).then((r) => r.data),
}
