export interface ConferenceSession {
  id: string
  session_name: string
  photographer_id: string | null
  client_email: string | null
  client_name: string | null
  status: 'active' | 'locked' | 'completed'
  expires_at: string | null
  created_at: string
}

export interface SessionPhoto {
  id: string
  session_id: string
  photo_url: string
  storage_path: string | null
  filename: string | null
  order_index: number
  created_at: string
}

export interface PhotoSelection {
  id: string
  session_id: string
  photo_id: string
  selected_by: string
  is_favourite: boolean
  comment: string | null
  selected_at: string
}

export type PresenceUser = {
  user_id: string
  role: 'photographer' | 'client'
  name: string
  online_at: string
}
