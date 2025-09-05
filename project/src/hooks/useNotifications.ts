import { useState, useEffect, useRef } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const notificationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }

  // Show immediate notification
  const showNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        requireInteraction: true,
        ...options
      })

      // Auto-close after 10 seconds if user doesn't interact
      setTimeout(() => {
        notification.close()
      }, 10000)

      return notification
    }
  }

  // Schedule a notification with setTimeout
  const scheduleNotification = (
    id: string,
    title: string, 
    body: string, 
    delay: number,
    onClick?: () => void
  ) => {
    if (permission !== 'granted') return

    // Clear existing timeout for this ID
    const existingTimeout = notificationTimeoutsRef.current.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Schedule new notification
    const timeout = setTimeout(() => {
      const notification = showNotification(title, body, {
        tag: id,
        data: { id }
      })

      if (notification && onClick) {
        notification.onclick = onClick
      }

      // Remove from timeouts map
      notificationTimeoutsRef.current.delete(id)
    }, delay)

    // Store timeout reference
    notificationTimeoutsRef.current.set(id, timeout)

    console.log(`📅 Notification scheduled for "${title}" in ${Math.round(delay / 1000)} seconds`)
  }

  // Cancel a scheduled notification
  const cancelNotification = (id: string) => {
    const timeout = notificationTimeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      notificationTimeoutsRef.current.delete(id)
      console.log(`❌ Cancelled notification for ${id}`)
    }
  }

  // Schedule revision reminder
  const scheduleRevisionReminder = (itemId: string, itemTitle: string, nextReviewTime: string) => {
    const nextReview = new Date(nextReviewTime).getTime()
    const now = Date.now()
    const delay = nextReview - now

    if (delay <= 0) {
      // Item is overdue - show immediately
      showNotification(
        '🔔 JEE Revision Reminder',
        `⚠️ OVERDUE: Time to review "${itemTitle}"`,
        {
          tag: itemId,
          requireInteraction: true
        }
      )
    } else if (delay <= 7 * 24 * 60 * 60 * 1000) { // Only schedule if within 7 days
      // Schedule for future
      scheduleNotification(
        itemId,
        '🔔 JEE Revision Reminder',
        `📚 Time to review: "${itemTitle}"`,
        delay,
        () => {
          // When notification is clicked, you could navigate to the item
          console.log(`Clicked notification for item: ${itemId}`)
        }
      )
    }
  }

  // Check for overdue items immediately
  const checkOverdueItems = (items: Array<{id: string, title: string, next_review: string}>) => {
    const now = new Date()
    const overdueItems = items.filter(item => 
      item.next_review && new Date(item.next_review) <= now
    )

    overdueItems.forEach(item => {
      showNotification(
        '🔔 JEE Revision Overdue',
        `⚠️ OVERDUE: "${item.title}" needs review!`,
        {
          tag: item.id,
          requireInteraction: true
        }
      )
    })

    return overdueItems
  }

  // Start periodic checking (every 5 minutes when app is open)
  const startPeriodicCheck = (items: Array<{id: string, title: string, next_review: string}>) => {
    // Clear existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
    }

    // Check immediately
    checkOverdueItems(items)

    // Then check every 5 minutes
    checkIntervalRef.current = setInterval(() => {
      console.log('🔍 Checking for overdue items...')
      checkOverdueItems(items)
    }, 5 * 60 * 1000) // 5 minutes

    console.log('✅ Started periodic overdue checking (every 5 minutes)')

    // Return cleanup function
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }

  // Stop all notifications and checking
  const stopAllNotifications = () => {
    // Clear periodic check
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }

    // Clear all scheduled notifications
    notificationTimeoutsRef.current.forEach(timeout => {
      clearTimeout(timeout)
    })
    notificationTimeoutsRef.current.clear()

    console.log('🛑 Stopped all notifications and checking')
  }

  // Get info about scheduled notifications
  const getScheduledCount = () => {
    return notificationTimeoutsRef.current.size
  }

  return {
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelNotification,
    scheduleRevisionReminder,
    checkOverdueItems,
    startPeriodicCheck,
    stopAllNotifications,
    getScheduledCount
  }
}