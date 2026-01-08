import React, { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw, Trash2, Filter, Zap, Sun, Home, Battery, AlertTriangle, Radio } from 'lucide-react'
import clsx from 'clsx'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import { usePageLoading } from '../hooks/useLoading'
import { useTheme } from '../hooks/useTheme'

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [liveIndicator, setLiveIndicator] = useState(true)
  const { isDark } = useTheme()
  const { isLoading: pageLoading } = usePageLoading(500, 1000)

  const categories = [
    { value: 'all', label: 'All Messages' },
    { value: 'battery', label: 'Battery' },
    { value: 'solar', label: 'Solar' },
    { value: 'grid', label: 'Grid' },
    { value: 'system', label: 'System' },
    { value: 'error', label: 'Errors' }
  ]

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Auto-refresh every 5 seconds
    return () => clearInterval(interval)
  }, [selectedCategory])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?category=${selectedCategory}`)
      const data = await response.json()
      setMessages(data || [])
      setLiveIndicator(true)
      setTimeout(() => setLiveIndicator(false), 1000)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  const getMessageIcon = (topic) => {
    if (topic.includes('battery')) return Battery
    if (topic.includes('solar') || topic.includes('pv')) return Sun
    if (topic.includes('grid')) return Zap
    if (topic.includes('power')) return Zap
    if (topic.includes('load')) return Home
    if (topic.includes('error') || topic.includes('fault')) return AlertTriangle
    return Radio
  }

  const getMessageColor = (topic) => {
    if (topic.includes('battery')) return 'text-blue-500'
    if (topic.includes('solar') || topic.includes('pv')) return 'text-yellow-500'
    if (topic.includes('grid')) return 'text-purple-500'
    if (topic.includes('error') || topic.includes('fault')) return 'text-red-500'
    return 'text-gray-500'
  }

  const MessageItem = ({ message, index }) => {
    const [topic, value] = message.split(': ')
    const Icon = getMessageIcon(topic)
    const iconColor = getMessageColor(topic)
    const timestamp = new Date().toLocaleTimeString()

    return (
      <div className="message-item p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <Icon className={clsx('w-5 h-5 mr-3', iconColor)} />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{topic}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{timestamp}</p>
            </div>
          </div>
        </div>
        <div className="ml-8">
          <p className="text-gray-700 dark:text-gray-300">{value}</p>
        </div>
      </div>
    )
  }

  if (pageLoading) {
    return <AdvancedLoadingOverlay message="Loading messages..." isDark={isDark} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center mb-4 lg:mb-0">
          <div className="w-12 h-12 bg-[#DEAF0B] rounded-xl flex items-center justify-center mr-4">
            <MessageSquare className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Incoming Messages</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Total: <strong>{messages.length}</strong></span>
              <div className="flex items-center">
                <div className={clsx('w-2 h-2 rounded-full mr-2', 
                  liveIndicator ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )} />
                <span>Live</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw className={clsx('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={clearMessages}
            className="btn btn-secondary"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-gray-500" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading messages...</span>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageItem key={index} message={message} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Messages Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No messages available for the selected category.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}