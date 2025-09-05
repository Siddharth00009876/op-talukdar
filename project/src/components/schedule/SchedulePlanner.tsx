import React, { useState } from 'react'
import { useSchedules } from '../../hooks/useSchedules'
import { useNotifications } from '../../hooks/useNotifications'
import { Plus, Clock, CheckCircle2, Circle, Play, Pause, Check } from 'lucide-react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'

interface SchedulePlannerProps {
  darkMode: boolean
}

const subjects = {
  Physics: 'bg-blue-500',
  Chemistry: 'bg-green-500',
  Mathematics: 'bg-orange-500',
  Revision: 'bg-purple-500',
  'Mock Test': 'bg-red-500'
} as const

const timeSlots = [
  '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00', '23:00'
]

export default function SchedulePlanner({ darkMode }: SchedulePlannerProps) {
  const { schedules, loading, createSchedule, markAsCompleted, deleteSchedule } = useSchedules()
  const { scheduleStudySession } = useNotifications()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [timer, setTimer] = useState({ active: false, minutes: 25, seconds: 0 })
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    subject: 'Physics' as keyof typeof subjects,
    topic: ''
  })

  // Get weekly dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Filter schedules for selected week
  const weekSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    return weekDates.some(date => isSameDay(date, scheduleDate))
  })

  // Pomodoro Timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (timer.active) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 }
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
          } else {
            toast.success('Pomodoro session completed! Take a 5-minute break.')
            return { ...prev, active: false, minutes: 25, seconds: 0 }
          }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer.active])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSchedule({
        ...formData,
        completed: false
      })
      setShowForm(false)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:00',
        subject: 'Physics',
        topic: ''
      })
    } catch (error) {
      console.error('Error creating schedule:', error)
    }
  }

  const handleMarkCompleted = async (scheduleId: string) => {
    try {
      await markAsCompleted(scheduleId)
    } catch (error) {
      console.error('Error marking schedule as completed:', error)
    }
  }

  const getTodaySchedules = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return schedules.filter(s => s.date === today && !s.completed)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button and Pomodoro Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Study Schedule
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Session</span>
          </button>
        </div>

        {/* Pomodoro Timer */}
        <div className={`flex items-center space-x-4 p-4 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Clock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`font-mono text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
          </span>
          <button
            onClick={() => setTimer(prev => ({ ...prev, active: !prev.active }))}
            className={`p-2 rounded-lg ${
              timer.active
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
          >
            {timer.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Today's Tasks Summary */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} border ${
        darkMode ? 'border-gray-700' : 'border-blue-200'
      }`}>
        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
          Today's Pending Sessions: {getTodaySchedules().length}
        </h3>
        <div className="space-y-2">
          {getTodaySchedules().slice(0, 3).map(schedule => (
            <div key={schedule.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${subjects[schedule.subject]}`}></div>
                <span className={darkMode ? 'text-gray-300' : 'text-blue-700'}>
                  {schedule.start_time} - {schedule.topic}
                </span>
              </div>
              <button
                onClick={() => handleMarkCompleted(schedule.id)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                <Check className="h-3 w-3" />
                <span>Complete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -7))}
          className={`px-3 py-2 rounded-lg ${
            darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } transition-colors`}
        >
          ← Previous Week
        </button>
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
        </h3>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 7))}
          className={`px-3 py-2 rounded-lg ${
            darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } transition-colors`}
        >
          Next Week →
        </button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} overflow-hidden`}>
        <div className="grid grid-cols-8 gap-0">
          {/* Time column header */}
          <div className={`p-3 font-medium ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'} border-r ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            Time
          </div>
          
          {/* Day headers */}
          {weekDates.map(date => (
            <div key={date.toISOString()} className={`p-3 text-center font-medium ${
              darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'
            } ${isSameDay(date, new Date()) ? 'bg-blue-100 text-blue-900' : ''}`}>
              <div>{format(date, 'EEE')}</div>
              <div className="text-sm">{format(date, 'MMM dd')}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {timeSlots.map(time => (
          <div key={time} className="grid grid-cols-8 gap-0 border-t border-gray-200">
            <div className={`p-3 text-sm font-medium ${
              darkMode ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200'
            } border-r`}>
              {time}
            </div>
            {weekDates.map(date => {
              const daySchedules = weekSchedules.filter(s => 
                isSameDay(new Date(s.date), date) && s.start_time === time
              )
              return (
                <div key={`${date.toISOString()}-${time}`} className={`p-1 min-h-[60px] ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  {daySchedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className={`${subjects[schedule.subject]} ${
                        schedule.completed ? 'opacity-50' : ''
                      } text-white p-2 rounded text-xs mb-1 relative group`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{schedule.topic}</span>
                        {schedule.completed ? 
                          <CheckCircle2 className="h-3 w-3 flex-shrink-0" /> : 
                          <Circle className="h-3 w-3 flex-shrink-0" />
                        }
                      </div>
                      <div className="text-xs opacity-90">
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                      
                      {/* Mark as Complete Button - appears on hover */}
                      {!schedule.completed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkCompleted(schedule.id)
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-1 py-0.5 text-xs transition-opacity"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Add Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Study Session
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Time
                  </label>
                  <select
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    End Time
                  </label>
                  <select
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value as keyof typeof subjects }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  {Object.keys(subjects).map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Topic
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g., Mechanics - Projectile Motion"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}