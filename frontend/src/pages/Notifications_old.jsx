import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Trash2, 
  Plus,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Volume2,
  VolumeX,
  Filter,
  TestTube,
  Download,
  Upload,
  Search,
  Sliders,
  Zap
} from 'lucide-react'
import clsx from 'clsx'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import RuleBuilder from '../components/RuleBuilder'
import RuleCard from '../components/RuleCard'
import { usePageLoading } from '../hooks/useLoading'
import { useTheme } from '../hooks/useTheme'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [rules, setRules] = useState([])
  const [templates, setTemplates] = useState([])
  const [stats, setStats] = useState({
    bySeverity: { critical: 0, warning: 0, info: 0 },
    last24Hours: 0
  })
  const [currentFilter, setCurrentFilter] = useState('all')
  const [ruleFilter, setRuleFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [activeTab, setActiveTab] = useState('notifications')
  const { isDark } = useTheme()
  const { isLoading: pageLoading } = usePageLoading(600, 1100)
  const [settings, setSettings] = useState({
    telegram: {
      enabled: false,
      token: '',
      chatId: '',
      types: {
        aiCharging: true,
        battery: true,
        price: true,
        system: true,
        criticalOnly: false
      }
    },
    thresholds: {
      batterySOC: { critical: 10, low: 20 },
      price: { optimal: 8 }
    },
    quietHours: { start: 22, end: 7 }
  })

  const severityFilters = [
    { id: 'all', label: 'All Severities', icon: Bell, color: 'gray' },
    { id: 'critical', label: 'Critical', icon: AlertCircle, color: 'red' },
    { id: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
    { id: 'info', label: 'Info', icon: Info, color: 'blue' }
  ]

  useEffect(() => {
    loadNotifications()
    loadRules()
    loadTemplates()
    loadStats()
    loadSettings()
    const interval = setInterval(() => {
      loadNotifications()
      loadStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications || [])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadRules = async () => {
    try {
      const response = await fetch('/api/notifications/rules')
      const data = await response.json()
      if (data.success) {
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error loading rules:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/notifications/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const createTestNotification = async (severity) => {
    const testData = {
      severity,
      title: `Test ${severity.charAt(0).toUpperCase() + severity.slice(1)} Notification`,
      message: `This is a test ${severity} notification to verify the system is working correctly.`,
      type: 'test_notification'
    }

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      if (response.ok) {
        setTimeout(loadNotifications, 500)
      }
    } catch (error) {
      console.error('Error creating test notification:', error)
    }
  }

  const clearAllNotifications = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      try {
        await fetch('/api/notifications/clear', { method: 'POST' })
        setNotifications([])
        loadStats()
      } catch (error) {
        console.error('Error clearing notifications:', error)
      }
    }
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  const testTelegramConnection = async () => {
    try {
      const response = await fetch('/api/notifications/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.telegram.token,
          chatId: settings.telegram.chatId
        })
      })

      const result = await response.json()
      alert(result.success ? 'Connection successful!' : `Connection failed: ${result.error}`)
    } catch (error) {
      alert('Error testing connection')
    }
  }

  const saveTelegramSettings = async () => {
    try {
      await fetch('/api/notifications/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.telegram)
      })
      alert('Telegram settings saved successfully')
    } catch (error) {
      alert('Error saving settings')
    }
  }

  const createRule = async (ruleData) => {
    try {
      const response = await fetch('/api/notifications/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      })
      const data = await response.json()
      if (data.success) {
        setRules(prev => [...prev, data.rule])
        setShowRuleBuilder(false)
        setEditingRule(null)
      }
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  const updateRule = async (ruleData) => {
    try {
      const response = await fetch(`/api/notifications/rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      })
      const data = await response.json()
      if (data.success) {
        setRules(prev => prev.map(rule => rule.id === editingRule.id ? data.rule : rule))
        setShowRuleBuilder(false)
        setEditingRule(null)
      }
    } catch (error) {
      console.error('Error updating rule:', error)
    }
  }

  const deleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      const response = await fetch(`/api/notifications/rules/${ruleId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId))
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const toggleRule = async (ruleId) => {
    try {
      const response = await fetch(`/api/notifications/rules/${ruleId}/toggle`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        setRules(prev => prev.map(rule => 
          rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
        ))
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const testRule = async (ruleId) => {
    try {
      const response = await fetch(`/api/notifications/rules/${ruleId}/test`, {
        method: 'POST'
      })
      const data = await response.json()
      return data.testResult
    } catch (error) {
      console.error('Error testing rule:', error)
      return null
    }
  }

  const duplicateRule = (rule) => {
    const duplicatedRule = {
      ...rule,
      name: `${rule.name} (Copy)`,
      enabled: false
    }
    delete duplicatedRule.id
    delete duplicatedRule.statistics
    delete duplicatedRule.createdAt
    delete duplicatedRule.updatedAt
    
    setEditingRule(duplicatedRule)
    setShowRuleBuilder(true)
  }

  const exportRules = async () => {
    try {
      const response = await fetch('/api/notifications/rules/export')
      const data = await response.json()
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `notification-rules-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting rules:', error)
    }
  }

  const importRules = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const response = await fetch('/api/notifications/rules/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`Successfully imported ${result.imported} rules`)
        loadRules()
      } else {
        alert(`Import failed: ${result.error}`)
      }
    } catch (error) {
      alert('Error importing rules: Invalid file format')
    }
    
    event.target.value = ''
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <Icon className={clsx('w-6 h-6', `text-${color}-500`)} />
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  )

  const NotificationItem = ({ notification }) => {
    const getSeverityIcon = (severity) => {
      switch (severity) {
        case 'critical': return AlertCircle
        case 'warning': return AlertTriangle
        case 'info': return Info
        default: return Bell
      }
    }

    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
        case 'warning': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
        case 'info': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
        default: return 'text-gray-500 bg-gray-50 dark:bg-gray-800'
      }
    }

    const Icon = getSeverityIcon(notification.severity)
    const colorClass = getSeverityColor(notification.severity)

    return (
      <div className={clsx('p-4 rounded-lg border transition-all hover:shadow-md', colorClass)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', 
            notification.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
            notification.severity === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          )}>
            {notification.severity}
          </span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 ml-8">{notification.message}</p>
      </div>
    )
  }

  const filteredNotifications = notifications.filter(notification => 
    currentFilter === 'all' || notification.severity === currentFilter
  )

  const filteredRules = rules.filter(rule => {
    const matchesFilter = ruleFilter === 'all' || 
      (ruleFilter === 'enabled' && rule.enabled) ||
      (ruleFilter === 'disabled' && !rule.enabled)
    
    const matchesSearch = !searchTerm || 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (pageLoading) {
    return <AdvancedLoadingOverlay message="Loading notifications..." isDark={isDark} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center mb-4 lg:mb-0">
          <div className="w-12 h-12 bg-[#DEAF0B] rounded-xl flex items-center justify-center mr-4">
            <Bell className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered notification system with intelligent filtering
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw className={clsx('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="btn btn-secondary"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button
            onClick={clearAllNotifications}
            className="btn btn-secondary"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={AlertCircle}
          label="Critical"
          value={stats.bySeverity.critical}
          color="red"
        />
        <StatCard
          icon={AlertTriangle}
          label="Warnings"
          value={stats.bySeverity.warning}
          color="yellow"
        />
        <StatCard
          icon={Info}
          label="Info"
          value={stats.bySeverity.info}
          color="blue"
        />
        <StatCard
          icon={Bell}
          label="Total (24h)"
          value={stats.last24Hours}
          color="gray"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          {severityFilters.map(filter => {
            const Icon = filter.icon
            return (
              <button
                key={filter.id}
                onClick={() => setCurrentFilter(filter.id)}
                className={clsx(
                  'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentFilter === filter.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {filter.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => createTestNotification('info')}
            className="btn btn-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Test Info
          </button>
          <button
            onClick={() => createTestNotification('warning')}
            className="btn btn-secondary"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Test Warning
          </button>
          <button
            onClick={() => createTestNotification('critical')}
            className="btn btn-secondary"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Test Critical
          </button>
          <button
            onClick={toggleSound}
            className="btn btn-secondary"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
            Sound {soundEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        {loading ? (
          <AdvancedLoadingOverlay message="Loading notifications..." isDark={isDark} />
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => (
              <NotificationItem key={index} notification={notification} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Notifications
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No notifications found for the selected filter.
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Telegram Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Telegram Integration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bot Token
                    </label>
                    <input
                      type="password"
                      value={settings.telegram.token}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        telegram: { ...prev.telegram, token: e.target.value }
                      }))}
                      placeholder="Enter bot token"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chat ID
                    </label>
                    <input
                      type="text"
                      value={settings.telegram.chatId}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        telegram: { ...prev.telegram, chatId: e.target.value }
                      }))}
                      placeholder="Enter chat ID"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={testTelegramConnection}
                      className="btn btn-secondary"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test
                    </button>
                    <button
                      onClick={saveTelegramSettings}
                      className="btn btn-primary"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Notification Types
                </h3>
                <div className="space-y-3">
                  {Object.entries(settings.telegram.types).map(([key, enabled]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          telegram: {
                            ...prev.telegram,
                            types: { ...prev.telegram.types, [key]: e.target.checked }
                          }
                        }))}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}