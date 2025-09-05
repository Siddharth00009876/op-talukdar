import React, { useState } from 'react'
import { useRevisionItems } from '../../hooks/useRevisionItems'
import { useNotifications } from '../../hooks/useNotifications'
import { Plus, Image, Clock, Star, Search, Filter, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface RevisionSystemProps {
  darkMode: boolean
}

const subjects = ['Physics', 'Chemistry', 'Mathematics', 'General']
const priorities = ['High', 'Medium', 'Low']

const priorityColors = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-green-100 text-green-800 border-green-200'
}

const priorityColorsDark = {
  High: 'bg-red-900/30 text-red-300 border-red-700',
  Medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  Low: 'bg-green-900/30 text-green-300 border-green-700'
}

export default function RevisionSystem({ darkMode }: RevisionSystemProps) {
  const { items, loading, createItem, updateItem, deleteItem, markAsReviewed } = useRevisionItems()
  const { permission, requestPermission, scheduleRevisionReminder } = useNotifications()
  
  const [showForm, setShowForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content_text: '',
    subject: 'Physics',
    priority: 'Medium',
    customInitialReminderDelay: 60
  })
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Request notification permission on mount
  React.useEffect(() => {
    if (permission === 'default') {
      requestPermission()
    }
  }, [permission, requestPermission])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let imageUrl = ''
      
      if (imageFile) {
        // Create object URL for temporary display
        // In production, you'd upload to Supabase storage here
        imageUrl = URL.createObjectURL(imageFile)
      }

      const result = await createItem({
        title: formData.title,
        content_text: formData.content_text,
        subject: formData.subject,
        priority: formData.priority as 'High' | 'Medium' | 'Low',
        image_url: imageUrl || undefined
      })

      if (result.error) {
        toast.error('Failed to create revision item')
        return
      }
      
      toast.success('Revision item created successfully!')
      
      setShowForm(false)
      setFormData({
        title: '',
        content_text: '',
        subject: 'Physics',
        priority: 'Medium',
        customInitialReminderDelay: 60
      })
      setImageFile(null)

      // Schedule first reminder
      if (permission === 'granted' && scheduleRevisionReminder) {
        scheduleRevisionReminder(formData.title, formData.customInitialReminderDelay * 60 * 1000)
      }
    } catch (error) {
      console.error('Error creating revision item:', error)
      toast.error('Failed to create revision item')
    }
  }

  const handleReview = async (item: any) => {
    try {
      const result = await markAsReviewed(item.id)
      
      if (result.error) {
        toast.error('Failed to mark as reviewed')
        return
      }

      toast.success('Item marked as reviewed!')
      
      // Schedule next reminder based on spaced repetition
      const intervals = [3600000, 86400000, 259200000, 604800000, 1209600000] // 1h, 1d, 3d, 1w, 2w
      const nextInterval = intervals[Math.min(item.review_count || 0, intervals.length - 1)]
      
      if (permission === 'granted' && scheduleRevisionReminder) {
        scheduleRevisionReminder(item.title, nextInterval)
      }
    } catch (error) {
      console.error('Error reviewing item:', error)
      toast.error('Failed to mark as reviewed')
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const result = await deleteItem(itemId)
      
      if (result.error) {
        toast.error('Failed to delete item')
        return
      }
      
      toast.success('Item deleted successfully!')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  // Filter items based on search and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.content_text && item.content_text.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSubject = !filterSubject || item.subject === filterSubject
    const matchesPriority = !filterPriority || item.priority === filterPriority
    
    return matchesSearch && matchesSubject && matchesPriority
  })

  // Get items due for review (with null check)
  const itemsDueForReview = items.filter(item => {
    if (!item.next_review) return true // If no next_review set, consider it due
    return new Date(item.next_review) <= new Date()
  }).length

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Smart Revision
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4">
          {itemsDueForReview > 0 && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
            }`}>
              {itemsDueForReview} due for review
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
          }`}>
            {items.length} total items
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search revision items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          />
        </div>
        
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className={`px-3 py-2 border rounded-lg ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className={`px-3 py-2 border rounded-lg ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
        >
          <option value="">All Priorities</option>
          {priorities.map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            } transition-colors hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                {item.title}
              </h3>
              <div className="flex items-center space-x-1 ml-2">
                <span className={`px-2 py-1 rounded-full text-xs border ${
                  darkMode ? priorityColorsDark[item.priority as keyof typeof priorityColorsDark] : priorityColors[item.priority as keyof typeof priorityColors]
                }`}>
                  {item.priority}
                </span>
              </div>
            </div>

            {item.image_url && (
              <div className="mb-3">
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            {item.content_text && (
              <p className={`text-sm mb-3 line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.content_text}
              </p>
            )}

            <div className="flex items-center justify-between text-xs mb-3">
              <span className={`px-2 py-1 rounded-full ${
                item.subject === 'Physics' ? 'bg-blue-100 text-blue-800' :
                item.subject === 'Chemistry' ? 'bg-green-100 text-green-800' :
                item.subject === 'Mathematics' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {item.subject}
              </span>
              <div className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="h-3 w-3" />
                <span>Reviewed {item.review_count || 0} times</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => handleReview(item)}
                className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
              >
                <Eye className="h-3 w-3" />
                <span>Review</span>
              </button>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setSelectedItem(item)}
                  className={`p-1 rounded transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className={`p-1 rounded transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:text-red-400' 
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {searchTerm || filterSubject || filterPriority ? 
            'No items match your filters.' : 
            'No revision items yet. Add your first item to get started!'
          }
        </div>
      )}

      {/* Add Item Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Revision Item
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="e.g., Newton's Laws of Motion"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notes/Content
                </label>
                <textarea
                  value={formData.content_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Add your notes, formulas, key concepts..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  First Reminder (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.customInitialReminderDelay}
                  onChange={(e) => setFormData(prev => ({ ...prev, customInitialReminderDelay: parseInt(e.target.value) || 60 }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="60"
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Set when you want the first reminder (1-1440 minutes)
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Image (Optional)
                </label>
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Image className={`h-8 w-8 mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {imageFile ? imageFile.name : 'Click to upload an image'}
                    </p>
                  </label>
                </div>
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
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedItem.title}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className={`text-gray-400 hover:text-gray-600`}
              >
                ✕
              </button>
            </div>

            {selectedItem.image_url && (
              <div className="mb-4">
                <img 
                  src={selectedItem.image_url} 
                  alt={selectedItem.title}
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              </div>
            )}

            {selectedItem.content_text && (
              <div className="mb-4">
                <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Content</h4>
                <p className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedItem.content_text}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-2 py-1 rounded-full ${
                  selectedItem.subject === 'Physics' ? 'bg-blue-100 text-blue-800' :
                  selectedItem.subject === 'Chemistry' ? 'bg-green-100 text-green-800' :
                  selectedItem.subject === 'Mathematics' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedItem.subject}
                </span>
                <span className={`px-2 py-1 rounded-full border ${
                  darkMode ? priorityColorsDark[selectedItem.priority as keyof typeof priorityColorsDark] : priorityColors[selectedItem.priority as keyof typeof priorityColors]
                }`}>
                  {selectedItem.priority}
                </span>
              </div>
              
              <button
                onClick={() => {
                  handleReview(selectedItem)
                  setSelectedItem(null)
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Mark as Reviewed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}