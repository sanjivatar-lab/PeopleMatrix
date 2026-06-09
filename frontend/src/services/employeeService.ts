import api from './api'
import type { Employee, EmployeeListResponse } from '../types'

type EmployeePayload = Omit<Employee, 'emp_id' | 'full_name'>

export const employeeService = {
  getAll: (page = 1, pageSize = 10, search?: string, bloodGroup?: string): Promise<EmployeeListResponse> => {
    const params: Record<string, unknown> = { page, page_size: pageSize }
    if (search) params.search = search
    if (bloodGroup) params.blood_group = bloodGroup
    return api.get('/employees/', { params }).then((r) => r.data)
  },

  getById: (empId: number): Promise<Employee> =>
    api.get(`/employees/${empId}`).then((r) => r.data),

  create: (payload: EmployeePayload): Promise<Employee> =>
    api.post('/employees/', payload).then((r) => r.data),

  update: (empId: number, payload: Partial<EmployeePayload>): Promise<Employee> =>
    api.put(`/employees/${empId}`, payload).then((r) => r.data),

  delete: (empId: number): Promise<void> =>
    api.delete(`/employees/${empId}`).then(() => undefined),

  bulkUpload: (file: File): Promise<{ created: number; updated: number; errors: string[] }> => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post('/employees/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data)
  },
}
