import { useState, useEffect } from 'react'
import { supabase, Schedule } from '../lib/supabase'
import toast from 'react-hot-toast'

// Enhanced Schedule interface (add this to your supabase.ts file)
export interface EnhancedSchedule extends Schedule {
  completed?: boolean
  completed_at?: string | null
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<EnhancedSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      toast.error('Failed to fetch schedules')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async (schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([schedule])
        .select()
        .single()

      if (error) throw error
      setSchedules(prev => [...prev, data])
      toast.success('Schedule added successfully')
      return data
    } catch (error) {
      toast.error('Failed to create schedule')
      throw error
    }
  }

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setSchedules(prev => prev.map(item => item.id === id ? data : item))
      toast.success('Schedule updated')
      return data
    } catch (error) {
      toast.error('Failed to update schedule')
      throw error
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSchedules(prev => prev.filter(item => item.id !== id))
      toast.success('Schedule deleted')
    } catch (error) {
      toast.error('Failed to delete schedule')
      throw error
    }
  }

  // Mark as completed function
  const markAsCompleted = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setSchedules(prev => prev.map(item => item.id === id ? data : item))
      toast.success('Schedule marked as completed')
      return data
    } catch (error) {
      toast.error('Failed to mark as completed')
      throw error
    }
  }

  return {
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    markAsCompleted,
    refreshSchedules: fetchSchedules
  }
}