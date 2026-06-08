import api from './api'
import type { WorkPackage, WorkPackageAssignment, PotentialOwner } from '../types'

export interface WorkPackagePayload {
  name: string
  description?: string
  start_date: string
  end_date?: string | null
  owner_emp_ids: number[]
}

export interface AssignmentPayload {
  emp_id: number
  start_date: string
  end_date?: string | null
}

const workPackageService = {
  getAll(): Promise<WorkPackage[]> {
    return api.get('/work-packages/').then((r) => r.data)
  },

  getById(id: number): Promise<WorkPackage> {
    return api.get(`/work-packages/${id}`).then((r) => r.data)
  },

  create(payload: WorkPackagePayload): Promise<WorkPackage> {
    return api.post('/work-packages/', payload).then((r) => r.data)
  },

  update(id: number, payload: Partial<WorkPackagePayload>): Promise<WorkPackage> {
    return api.put(`/work-packages/${id}`, payload).then((r) => r.data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/work-packages/${id}`).then(() => {})
  },

  getAssignments(wpId: number): Promise<WorkPackageAssignment[]> {
    return api.get(`/work-packages/${wpId}/assignments`).then((r) => r.data)
  },

  addAssignment(wpId: number, payload: AssignmentPayload): Promise<WorkPackageAssignment> {
    return api.post(`/work-packages/${wpId}/assignments`, payload).then((r) => r.data)
  },

  updateAssignment(wpId: number, assignmentId: number, payload: Partial<AssignmentPayload>): Promise<WorkPackageAssignment> {
    return api.put(`/work-packages/${wpId}/assignments/${assignmentId}`, payload).then((r) => r.data)
  },

  removeAssignment(wpId: number, assignmentId: number): Promise<void> {
    return api.delete(`/work-packages/${wpId}/assignments/${assignmentId}`).then(() => {})
  },

  getPotentialOwners(): Promise<PotentialOwner[]> {
    return api.get('/roles/potential-owners').then((r) => r.data)
  },
}

export default workPackageService
