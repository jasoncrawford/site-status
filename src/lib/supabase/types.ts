export type Site = {
  id: string
  name: string
  url: string
  created_at: string
}

export type Check = {
  id: string
  site_id: string
  status: 'success' | 'failure'
  status_code: number | null
  error: string | null
  checked_at: string
}

export type Incident = {
  id: string
  site_id: string
  check_id: string
  status: 'open' | 'resolved'
  opened_at: string
  resolved_at: string | null
}

export type Contact = {
  id: string
  email: string
  created_at: string
}

export type Invitation = {
  id: string
  email: string
  invited_by: string
  token: string
  accepted_at: string | null
  created_at: string
}
