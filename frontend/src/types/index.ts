export interface Employee {
  emp_id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  mobile_number?: string
  native_place?: string
  years_of_experience: number
}

export interface EmployeeListResponse {
  total: number
  page: number
  page_size: number
  employees: Employee[]
}

export interface Role {
  id: number
  name: string
}

export interface EmployeeRole {
  id: number
  emp_id: number
  role_id: number
  role_name: string
  assigned_at: string
}

export interface SupervisorMapping {
  id: number
  employee_emp_id: number
  employee_name: string
  supervisor_emp_id: number
  supervisor_name: string
  start_date: string
  end_date?: string | null
}

export interface Competency {
  id: number
  name: string
  category?: string | null
}

export interface EmployeeCompetency {
  id: number
  emp_id: number
  competency_id: number
  competency_name: string
}

export interface BulkUploadResult {
  created: number
  updated: number
  errors: string[]
}

export interface PotentialOwner {
  emp_id: number
  full_name: string
  role_name: string
}

export interface WorkPackageOwner {
  id: number
  emp_id: number
  employee_name: string
}

export interface WorkPackage {
  id: number
  name: string
  description?: string | null
  start_date: string
  end_date?: string | null
  owners: WorkPackageOwner[]
  assignment_count: number
}

export interface WorkPackageAssignment {
  id: number
  work_package_id: number
  emp_id: number
  employee_name: string
  start_date: string
  end_date?: string | null
}
