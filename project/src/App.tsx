import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Header from './components/layout/Header'
import SchedulePlanner from './components/schedule/SchedulePlanner'
import RevisionSystem from './components/revision/RevisionSystem'

function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'revision'>('schedule')
  const [darkMode, setDarkMode] = useState(false)

  React.useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true)
    }
  }, [])

  React.useEffect(() => {
    // Apply theme to document
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'schedule' ? (
          <SchedulePlanner darkMode={darkMode} />
        ) : (
          <RevisionSystem darkMode={darkMode} />
        )}
      </main>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          className: darkMode ? '!bg-gray-800 !text-white' : '',
        }}
      />
    </div>
  )
}

export default App