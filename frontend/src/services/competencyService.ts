import api from './api'
import type { Competency, EmployeeCompetency } from '../types'

export const competencyService = {
  getAll: (): Promise<Competency[]> => api.get('/competencies/').then((r) => r.data),

  create: (name: string, category?: string): Promise<Competency> =>
    api.post('/competencies/', { name, category }).then((r) => r.data),

  assign: (empId: number, competencyIds: number[]): Promise<EmployeeCompetency[]> =>
    api
      .post('/competencies/assign', { emp_id: empId, competency_ids: competencyIds })
      .then((r) => r.data),

  getForEmployee: (empId: number): Promise<EmployeeCompetency[]> =>
    api.get(`/competencies/${empId}`).then((r) => r.data),

  remove: (empId: number, competencyId: number): Promise<void> =>
    api.delete(`/competencies/${empId}/${competencyId}`).then(() => undefined),
}
