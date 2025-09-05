import React from 'react'
import { Clock, BookOpen, Calendar, Bell } from 'lucide-react'

interface HeaderProps {
  activeTab: 'schedule' | 'revision'
  onTabChange: (tab: 'schedule' | 'revision') => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export default function Header({ activeTab, onTabChange, darkMode, onToggleDarkMode }: HeaderProps) {
  const daysUntilJEE = Math.ceil((new Date('2026-01-31').getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors ${
      darkMode 
        ? 'bg-gray-900/95 border-gray-800 backdrop-blur-sm' 
        : 'bg-white/95 border-gray-200 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                JEE Mains 2026
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {daysUntilJEE} days to go
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onTabChange('schedule')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'schedule'
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </button>
            <button
              onClick={() => onTabChange('revision')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'revision'
                  ? darkMode
                    ? 'bg-green-600 text-white'
                    : 'bg-green-500 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Revision</span>
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}