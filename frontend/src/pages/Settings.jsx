import React, { useState, useEffect } from 'react'
import { Save, Settings, Globe, Key, Wifi, Zap, Sliders, Battery, Power } from 'lucide-react'
import { usePageLoading } from '../hooks/useLoading'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import { useTheme } from '../hooks/useTheme'

export default function NewSettings() {
  const [settings, setSettings] = useState({
    timezone: 'UTC',
    apiKey: '',
    selectedZone: '',
    tibber: {
      enabled: false,
      apiKey: '',
      country: 'DE'
    },
    mqtt: {
      host: 'localhost',
      port: 1883,
      username: '',
      password: '',
      topicPrefix: 'solar',
      clientId: '',
      clientSecret: '',
      inverterNumber: 1,
      batteryNumber: 1
    }
  })
  
  const [rangeSettings, setRangeSettings] = useState({
    'Load Power': { title: 'Load Power', min: 0, max: 5000, unit: 'W' },
    'Grid Voltage': { title: 'Grid Voltage', min: 200, max: 250, unit: 'V' },
    'Battery Power': { title: 'Battery Power', min: -3000, max: 3000, unit: 'W' },
    'Grid Power': { title: 'Grid Power', min: -5000, max: 5000, unit: 'W' },
    'Solar PV Power': { title: 'Solar PV Power', min: 0, max: 8000, unit: 'W' },
    'Battery SOC': { title: 'Battery SOC', min: 0, max: 100, unit: '%' },
    'Battery Voltage': { title: 'Battery Voltage', min: 48, max: 58, unit: 'V' }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const { isDark } = useTheme()
  const { isLoading: pageLoading } = usePageLoading(500, 1000)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [settingsResponse, tibberResponse, configResponse, rangeResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/tibber/config'),
        fetch('/api/config/check'),
        fetch('/api/solar-data')
      ])
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        if (settingsData.success) {
          setSettings(prev => ({
            ...prev,
            apiKey: settingsData.apiKey || '',
            selectedZone: settingsData.selectedZone || ''
          }))
        }
      }
      
      if (tibberResponse.ok) {
        const tibberData = await tibberResponse.json()
        if (tibberData.success) {
          setSettings(prev => ({
            ...prev,
            tibber: {
              enabled: tibberData.config.enabled || false,
              apiKey: tibberData.config.apiKey || '',
              country: tibberData.config.country || 'DE'
            }
          }))
        }
      }
      
      if (configResponse.ok) {
        const data = await configResponse.json()
        if (data.success) {
          setSettings(prev => ({
            ...prev,
            mqtt: {
              ...prev.mqtt,
              host: data.config.mqtt_host || 'localhost',
              port: data.config.mqtt_port || 1883,
              username: data.config.mqtt_username || '',
              password: data.config.mqtt_password || '',
              topicPrefix: data.config.mqtt_topic_prefix || 'solar',
              clientId: data.config.clientId || '',
              clientSecret: data.config.clientSecret || '',
              inverterNumber: data.config.inverter_number || 1,
              batteryNumber: data.config.battery_number || 1
            },
            timezone: data.config.timezone || 'UTC'
          }))
        }
      }
      
      if (rangeResponse.ok) {
        const rangeData = await rangeResponse.json()
        setRangeSettings(rangeData)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Save general settings
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          selectedZone: settings.selectedZone,
          timezone: settings.timezone
        })
      })

      // Save MQTT config
      await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mqtt_host: settings.mqtt.host,
          mqtt_port: settings.mqtt.port,
          mqtt_username: settings.mqtt.username,
          mqtt_password: settings.mqtt.password,
          mqtt_topic_prefix: settings.mqtt.topicPrefix,
          clientId: settings.mqtt.clientId,
          clientSecret: settings.mqtt.clientSecret,
          inverter_number: settings.mqtt.inverterNumber,
          battery_number: settings.mqtt.batteryNumber,
          timezone: settings.timezone
        })
      })

      // Save Tibber config
      await fetch('/api/tibber/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: settings.tibber.enabled,
          apiKey: settings.tibber.apiKey,
          country: settings.tibber.country
        })
      })
      
      // Save range settings
      await fetch('/api/update-panel-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rangeSettings)
      })

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (path, value) => {
    const keys = path.split('.')
    setSettings(prev => {
      const newSettings = { ...prev }
      let current = newSettings
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }
  
  const handleRangeChange = (key, field, value) => {
    setRangeSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: parseFloat(value) }
    }))
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'mqtt', name: 'MQTT', icon: Wifi },
    { id: 'tibber', name: 'Tibber', icon: Zap },
    { id: 'ranges', name: 'Ranges', icon: Sliders }
  ]

  const timezones = [
    { value: 'UTC', label: '(GMT+00:00) UTC' },
    { value: 'Europe/Berlin', label: '(GMT+01:00) Berlin' },
    { value: 'Europe/London', label: '(GMT+00:00) London' },
    { value: 'Europe/Paris', label: '(GMT+01:00) Paris' },
    { value: 'America/New_York', label: '(GMT-05:00) New York' }
  ]

  const zones = [
    { code: 'DE', name: 'Germany' },
    { code: 'NO', name: 'Norway' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'AT', name: 'Austria' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'GB', name: 'United Kingdom' }
  ]
  
  const getIcon = (title) => {
    const t = title.toLowerCase()
    if (t.includes('load')) return '🏠'
    if (t.includes('grid') && t.includes('voltage')) return '⚡'
    if (t.includes('battery') && t.includes('power')) return '🔋'
    if (t.includes('grid') && t.includes('power')) return '🔌'
    if (t.includes('solar') || t.includes('pv')) return '☀️'
    if (t.includes('soc')) return '📊'
    if (t.includes('voltage')) return '🔋'
    return '⚙️'
  }

  if (pageLoading || loading) {
    return <AdvancedLoadingOverlay message="Loading system settings..." isDark={isDark} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Settings className="w-8 h-8 text-[#DEAF0B] mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              System Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Configure your SolarAutopilot system for optimal performance</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-gray-200 dark:bg-gray-800 p-2 rounded-xl">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                  activeTab === tab.id
                    ? 'bg-[#DEAF0B] text-black shadow-lg transform scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-gray-700/70'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Globe className="w-4 h-4 mr-2" />
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Key className="w-4 h-4 mr-2" />
                    Electricity Map API Key
                  </label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="Enter API key"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Globe className="w-4 h-4 mr-2" />
                  Carbon Intensity Zone
                </label>
                <select
                  value={settings.selectedZone}
                  onChange={(e) => handleInputChange('selectedZone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a zone</option>
                  {zones.map(zone => (
                    <option key={zone.code} value={zone.code}>{zone.name} ({zone.code})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'mqtt' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Wifi className="w-4 h-4 mr-2" />
                    MQTT Host
                  </label>
                  <input
                    type="text"
                    value={settings.mqtt.host}
                    onChange={(e) => handleInputChange('mqtt.host', e.target.value)}
                    placeholder="localhost or IP address"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Wifi className="w-4 h-4 mr-2" />
                    Port
                  </label>
                  <input
                    type="number"
                    value={settings.mqtt.port}
                    onChange={(e) => handleInputChange('mqtt.port', parseInt(e.target.value))}
                    placeholder="1883"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Key className="w-4 h-4 mr-2" />
                    Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.mqtt.username}
                    onChange={(e) => handleInputChange('mqtt.username', e.target.value)}
                    placeholder="MQTT username"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Key className="w-4 h-4 mr-2" />
                    Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={settings.mqtt.password}
                    onChange={(e) => handleInputChange('mqtt.password', e.target.value)}
                    placeholder="MQTT password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Key className="w-4 h-4 mr-2" />
                    Client ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.mqtt.clientId}
                    onChange={(e) => handleInputChange('mqtt.clientId', e.target.value)}
                    placeholder="MQTT client ID"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Key className="w-4 h-4 mr-2" />
                    Client Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={settings.mqtt.clientSecret}
                    onChange={(e) => handleInputChange('mqtt.clientSecret', e.target.value)}
                    placeholder="MQTT client secret"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Wifi className="w-4 h-4 mr-2" />
                    Topic Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.mqtt.topicPrefix}
                    onChange={(e) => handleInputChange('mqtt.topicPrefix', e.target.value)}
                    placeholder="solar"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Power className="w-4 h-4 mr-2" />
                    Inverter Count
                  </label>
                  <input
                    type="number"
                    value={settings.mqtt.inverterNumber}
                    onChange={(e) => handleInputChange('mqtt.inverterNumber', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Battery className="w-4 h-4 mr-2" />
                    Battery Count
                  </label>
                  <input
                    type="number"
                    value={settings.mqtt.batteryNumber}
                    onChange={(e) => handleInputChange('mqtt.batteryNumber', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tibber' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.tibber.enabled}
                    onChange={(e) => handleInputChange('tibber.enabled', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-4"
                  />
                  <div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Enable Tibber Integration
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Activate dynamic pricing for optimal charging
                    </p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Key className="w-4 h-4 mr-2" />
                    Tibber API Key
                  </label>
                  <input
                    type="password"
                    value={settings.tibber.apiKey}
                    onChange={(e) => handleInputChange('tibber.apiKey', e.target.value)}
                    placeholder="Enter Tibber API key"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <Globe className="w-4 h-4 mr-2" />
                    Country
                  </label>
                  <select
                    value={settings.tibber.country}
                    onChange={(e) => handleInputChange('tibber.country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="NO">🇳🇴 Norway</option>
                    <option value="SE">🇸🇪 Sweden</option>
                    <option value="DK">🇩🇰 Denmark</option>
                    <option value="FI">🇫🇮 Finland</option>
                    <option value="AT">🇦🇹 Austria</option>
                    <option value="NL">🇳🇱 Netherlands</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'ranges' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Gauge Range Settings</h3>
                <p className="text-gray-600 dark:text-gray-400">Configure min/max values for dashboard gauges and charts</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(rangeSettings).map(([key, config]) => (
                  <div key={key} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{getIcon(config.title || key)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {config.title || key}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Unit: {config.unit || 'W'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Min Value
                        </label>
                        <input
                          type="number"
                          value={config.min || 0}
                          onChange={(e) => handleRangeChange(key, 'min', e.target.value)}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Value
                        </label>
                        <input
                          type="number"
                          value={config.max || 100}
                          onChange={(e) => handleRangeChange(key, 'max', e.target.value)}
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Changes are saved automatically to your system configuration
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-3 bg-[#DEAF0B] text-black rounded-lg hover:bg-[#c49a0a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}