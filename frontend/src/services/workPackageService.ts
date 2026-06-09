import api from './api'
import type { WorkPackage, WorkPackageAssignment, PotentialOwner, WpActivity, WpBlocker } from '../types'

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

  updateStatus(id: number, status: string | null): Promise<WorkPackage> {
    return api.put(`/work-packages/${id}`, { status }).then((r) => r.data)
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

  // Activities
  getActivities(wpId: number): Promise<WpActivity[]> {
    return api.get(`/work-packages/${wpId}/activities`).then((r) => r.data)
  },
  addActivity(wpId: number, payload: { description: string; status: string }): Promise<WpActivity> {
    return api.post(`/work-packages/${wpId}/activities`, payload).then((r) => r.data)
  },
  updateActivity(wpId: number, actId: number, payload: { description?: string; status?: string }): Promise<WpActivity> {
    return api.put(`/work-packages/${wpId}/activities/${actId}`, payload).then((r) => r.data)
  },
  deleteActivity(wpId: number, actId: number): Promise<void> {
    return api.delete(`/work-packages/${wpId}/activities/${actId}`).then(() => {})
  },

  // Blockers
  getBlockers(wpId: number): Promise<WpBlocker[]> {
    return api.get(`/work-packages/${wpId}/blockers`).then((r) => r.data)
  },
  addBlocker(wpId: number, payload: { description: string; raised_on?: string | null }): Promise<WpBlocker> {
    return api.post(`/work-packages/${wpId}/blockers`, payload).then((r) => r.data)
  },
  updateBlocker(wpId: number, blockerId: number, payload: { description?: string; status?: string; raised_on?: string | null; resolved_on?: string | null }): Promise<WpBlocker> {
    return api.put(`/work-packages/${wpId}/blockers/${blockerId}`, payload).then((r) => r.data)
  },
  deleteBlocker(wpId: number, blockerId: number): Promise<void> {
    return api.delete(`/work-packages/${wpId}/blockers/${blockerId}`).then(() => {})
  },
}

export default workPackageService
