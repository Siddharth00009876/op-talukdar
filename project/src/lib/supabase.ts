import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Schedule {
  id: string
  date: string
  start_time: string
  end_time: string
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Revision' | 'Mock Test'
  topic: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface RevisionItem {
  id: string
  title: string
  content_text?: string
  image_url?: string
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'General'
  priority: 'High' | 'Medium' | 'Low'
  created_at: string
  last_reviewed: string
  review_count: number
  next_review: string
}

export interface NotificationSetting {
  id: string
  item_id: string
  intervals: string[]
  next_reminder: string
  is_active: boolean
  created_at: string
}