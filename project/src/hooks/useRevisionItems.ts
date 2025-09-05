import { useState, useEffect } from 'react'
import { supabase, RevisionItem } from '../lib/supabase'
import { useNotifications } from './useNotifications'
import toast from 'react-hot-toast'

export function useRevisionItems() {
  const [items, setItems] = useState<RevisionItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Get notification functions
  const { 
    permission, 
    requestPermission, 
    scheduleRevisionReminder, 
    checkOverdueItems,
    startPeriodicCheck,
    stopAllNotifications,
    getScheduledCount
  } = useNotifications()

  useEffect(() => {
    fetchItems()
  }, [])

  // Start periodic checking when items are loaded and permission is granted
  useEffect(() => {
    if (items.length > 0 && permission === 'granted') {
      const stopChecking = startPeriodicCheck(items)
      
      // Schedule notifications for all future items
      scheduleAllNotifications()
      
      return stopChecking
    }
  }, [items, permission])

  // Schedule notifications for all items that have future review dates
  const scheduleAllNotifications = () => {
    items.forEach(item => {
      if (item.next_review) {
        scheduleRevisionReminder(item.id, item.title, item.next_review)
      }
    })
  }

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('revision_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      toast.error('Failed to fetch revision items')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createItem = async (item: Omit<RevisionItem, 'id' | 'created_at' | 'last_reviewed' | 'review_count' | 'next_review'>) => {
    try {
      // Set initial next_review to 24 hours from now
      const nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const itemWithReview = {
        ...item,
        next_review: nextReview,
        review_count: 0
      }

      const { data, error } = await supabase
        .from('revision_items')
        .insert([itemWithReview])
        .select()
        .single()

      if (error) throw error
      setItems(prev => [data, ...prev])
      
      // Schedule notification for this new item
      if (permission === 'granted') {
        scheduleRevisionReminder(data.id, data.title, data.next_review)
        toast.success(`✅ Item added! Reminder set for ${new Date(data.next_review).toLocaleString()}`)
      } else {
        toast.success('Revision item added successfully')
      }
      
      return data
    } catch (error) {
      toast.error('Failed to create revision item')
      throw error
    }
  }

  const updateItem = async (id: string, updates: Partial<RevisionItem>) => {
    try {
      const { data, error } = await supabase
        .from('revision_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setItems(prev => prev.map(item => item.id === id ? data : item))
      
      // If next_review was updated, reschedule notification
      if (updates.next_review && permission === 'granted') {
        scheduleRevisionReminder(data.id, data.title, data.next_review)
        toast.success('Item updated and reminder rescheduled')
      }
      
      return data
    } catch (error) {
      toast.error('Failed to update revision item')
      throw error
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('revision_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      setItems(prev => prev.filter(item => item.id !== id))
      toast.success('Revision item deleted')
    } catch (error) {
      toast.error('Failed to delete revision item')
      throw error
    }
  }

  const markAsReviewed = async (id: string) => {
    try {
      const nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .rpc('increment_review_count', { 
          item_id: id,
          next_review_date: nextReview 
        })
      
      if (error) throw error
      setItems(prev => prev.map(item => item.id === id ? data : item))
      
      // Schedule next notification
      if (permission === 'granted') {
        scheduleRevisionReminder(data.id, data.title, data.next_review)
        toast.success(`✅ Marked as reviewed! Next reminder: ${new Date(data.next_review).toLocaleString()}`)
      } else {
        toast.success('Marked as reviewed')
      }
      
      return data
    } catch (error) {
      toast.error('Failed to mark as reviewed')
      throw error
    }
  }

  // Function to enable notifications with better UX
  const enableNotifications = async () => {
    try {
      const result = await requestPermission()
      if (result === 'granted') {
        toast.success('🔔 Notifications enabled! You\'ll now receive reminders.')
        
        // Schedule notifications for all existing items
        scheduleAllNotifications()
        
        // Show count of scheduled notifications
        setTimeout(() => {
          const count = getScheduledCount()
          if (count > 0) {
            toast.success(`📅 ${count} reminders scheduled!`)
          }
        }, 1000)
        
      } else if (result === 'denied') {
        toast.error('❌ Notifications blocked. Please enable them in your browser settings.')
      } else {
        toast.error('⚠️ Notification permission dismissed.')
      }
    } catch (error) {
      toast.error('Failed to enable notifications')
      console.error('Notification error:', error)
    }
  }

  // Get overdue items count
  const getOverdueCount = () => {
    const now = new Date()
    return items.filter(item => 
      item.next_review && new Date(item.next_review) <= now
    ).length
  }

  // Manual check for overdue items
  const checkNow = () => {
    if (permission === 'granted') {
      const overdueItems = checkOverdueItems(items)
      if (overdueItems.length === 0) {
        toast.success('✅ No overdue items!')
      } else {
        toast.success(`📋 Found ${overdueItems.length} overdue items`)
      }
    } else {
      toast.error('Enable notifications first')
    }
  }

  return {
    items,
    loading,
    permission,
    createItem,
    updateItem,
    deleteItem,
    markAsReviewed,
    enableNotifications,
    getOverdueCount,
    getScheduledCount,
    checkNow,
    stopAllNotifications,
    refreshItems: fetchItems
  }
}