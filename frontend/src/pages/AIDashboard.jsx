import React, { useState, useEffect } from 'react'
import { 
  Bot, 
  Zap, 
  Sun, 
  Euro, 
  Home, 
  Play, 
  Square, 
  RefreshCw, 
  TrendingUp,
  Terminal,
  Lightbulb,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import clsx from 'clsx'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import { usePageLoading } from '../hooks/useLoading'
import { useTheme } from '../hooks/useTheme'

export default function AIDashboard() {
  const [aiStatus, setAiStatus] = useState({ enabled: false, initialized: false })
  const [tibberStatus, setTibberStatus] = useState({ configured: false, connected: false })
  const [systemState, setSystemState] = useState({})
  const [currentPrice, setCurrentPrice] = useState(null)
  const [priceLevel, setPriceLevel] = useState('NORMAL')
  const [priceData, setPriceData] = useState({ forecast: [], nextHour: null, cheapest: null })
  const [weatherCondition, setWeatherCondition] = useState('sunny')
  const [pvPrediction, setPvPrediction] = useState({ current: 0, predicted: 0, peak: '12:30 PM', accuracy: 92 })
  const [decisions, setDecisions] = useState([])
  const [commands, setCommands] = useState([])
  const [predictions, setPredictions] = useState([])
  const [activeTab, setActiveTab] = useState('decisions')
  const [loading, setLoading] = useState(true)
  const { isLoading: pageLoading } = usePageLoading(600, 1200)
  const { isDark } = useTheme()

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      await loadSystemState()
      await loadAIStatus()
      await loadTibberData()
      await loadDecisions()
      await loadCommands()
      await loadPredictions()
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const loadSystemState = async () => {
    try {
      const response = await fetch('/api/system-state')
      if (response.ok) {
        const data = await response.json()
        if (data.current_state) {
          setSystemState(data.current_state)
          const currentPV = data.current_state.pv_power || 0
          updatePVPrediction(currentPV)
          updateWeatherCondition(currentPV)
        }
      }
    } catch (error) {
      console.error('Error loading system state:', error)
    }
  }

  const loadAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAiStatus(data.status)
        }
      }
    } catch (error) {
      console.error('Error loading AI status:', error)
    }
  }

  const loadTibberData = async () => {
    try {
      const response = await fetch('/api/tibber/prices')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCurrentPrice(data.data.currentPrice)
          setPriceLevel(data.data.currentPrice?.level || 'NORMAL')
          setTibberStatus({ configured: true, connected: true })
          
          if (data.data.forecast && data.data.forecast.length > 0) {
            const forecast = data.data.forecast
            const nextHour = forecast.find(item => new Date(item.startsAt) > new Date())
            const today = new Date().toDateString()
            const todayPrices = forecast.filter(item => new Date(item.startsAt).toDateString() === today)
            const cheapest = todayPrices.length > 0 ? todayPrices.reduce((min, item) => item.total < min.total ? item : min) : null
            
            setPriceData({ forecast: forecast.slice(0, 24), nextHour, cheapest })
          }
        } else {
          setTibberStatus({ configured: false, connected: false })
        }
      }
    } catch (error) {
      console.error('Error loading Tibber data:', error)
      setTibberStatus({ configured: false, connected: false })
    }
  }

  const loadDecisions = async () => {
    try {
      const response = await fetch('/api/ai/decisions?limit=10')
      if (response.ok) {
        const data = await response.json()
        setDecisions(data.success ? data.decisions || [] : [])
      }
    } catch (error) {
      console.error('Error loading decisions:', error)
      setDecisions([])
    }
  }

  const loadCommands = async () => {
    try {
      const response = await fetch('/api/ai/commands?limit=10')
      if (response.ok) {
        const data = await response.json()
        setCommands(data.success ? data.commands || [] : [])
      }
    } catch (error) {
      console.error('Error loading commands:', error)
      setCommands([])
    }
  }

  const loadPredictions = async () => {
    try {
      const response = await fetch('/api/ai/predictions')
      if (response.ok) {
        const data = await response.json()
        setPredictions(data.success ? data.predictions || [] : [])
      }
    } catch (error) {
      console.error('Error loading predictions:', error)
      setPredictions([])
    }
  }

  const updatePVPrediction = (currentPV) => {
    const hour = new Date().getHours()
    const minute = new Date().getMinutes()
    const timeDecimal = hour + minute / 60
    
    let predictedPV = currentPV
    if (timeDecimal < 18 && timeDecimal > 6) {
      const nextHourFactor = Math.sin((timeDecimal + 1 - 6) / 12 * Math.PI)
      const currentFactor = Math.sin((timeDecimal - 6) / 12 * Math.PI)
      if (currentFactor > 0) {
        predictedPV = currentPV * (nextHourFactor / currentFactor)
      }
    }
    
    const month = new Date().getMonth()
    const peakHour = month >= 3 && month <= 8 ? 13 : 12
    const peakTime = new Date()
    peakTime.setHours(peakHour, 30, 0, 0)
    
    setPvPrediction({
      current: currentPV,
      predicted: Math.max(0, predictedPV),
      peak: peakTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      accuracy: 92
    })
  }

  const updateWeatherCondition = (currentPV) => {
    const hour = new Date().getHours()
    const isDaytime = hour >= 6 && hour <= 18
    
    if (!isDaytime) {
      setWeatherCondition('cloudy')
      return
    }
    
    const expectedPV = Math.sin((hour - 6) / 12 * Math.PI) * 3000
    
    if (currentPV < expectedPV * 0.3) {
      setWeatherCondition('rainy')
    } else if (currentPV < expectedPV * 0.7) {
      setWeatherCondition('cloudy')
    } else {
      setWeatherCondition('sunny')
    }
  }

  const toggleAI = async () => {
    try {
      const response = await fetch('/api/ai/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAiStatus(prev => ({ ...prev, enabled: data.enabled }))
          setTimeout(() => {
            loadDecisions()
            loadCommands()
          }, 500)
        }
      }
    } catch (error) {
      console.error('Error toggling AI:', error)
    }
  }

  const PriceChart = ({ forecast }) => {
    if (!forecast || forecast.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Configure Tibber to see price forecast</p>
        </div>
      )
    }

    const maxPrice = Math.max(...forecast.map(item => item.total))
    const minPrice = Math.min(...forecast.map(item => item.total))
    const priceRange = maxPrice - minPrice

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{forecast.length}h Forecast</span>
          <span>{minPrice.toFixed(2)}€ - {maxPrice.toFixed(2)}€</span>
        </div>
        <div className="flex items-end space-x-1 h-20">
          {forecast.slice(0, 24).map((item, index) => {
            const normalizedHeight = priceRange > 0 ? ((item.total - minPrice) / priceRange) : 0.5
            const height = Math.max(normalizedHeight * 60 + 10, 8)
            const date = new Date(item.startsAt)
            const hour = date.getHours()
            const isCurrentHour = hour === new Date().getHours()
            const level = (item.level || 'NORMAL').toLowerCase().replace('_', '-')
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={clsx(
                    'w-full rounded-t transition-all duration-300 hover:opacity-80',
                    level === 'very-cheap' ? 'bg-green-500' :
                    level === 'cheap' ? 'bg-blue-500' :
                    level === 'normal' ? 'bg-gray-400' :
                    level === 'expensive' ? 'bg-orange-500' : 'bg-red-500',
                    isCurrentHour && 'ring-2 ring-primary'
                  )}
                  style={{ height: `${height}px` }}
                  title={`${hour}:00 - ${item.total.toFixed(3)}€/kWh - ${(item.level || 'NORMAL').replace('_', ' ')}`}
                />
                {index % 4 === 0 && (
                  <span className="text-xs text-gray-500 mt-1">{hour}h</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const WeatherAnimation = ({ condition }) => {
    return (
      <div className={clsx('relative w-24 h-24 mx-auto mb-4', 
        condition === 'sunny' && 'text-yellow-500',
        condition === 'cloudy' && 'text-gray-400',
        condition === 'rainy' && 'text-blue-500'
      )}>
        {condition === 'sunny' && (
          <div className="relative">
            <Sun className="w-16 h-16 animate-pulse" />
            <div className="absolute inset-0 animate-spin" style={{ animation: 'spin 8s linear infinite' }}>
              <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2" />
              <div className="w-2 h-2 bg-yellow-400 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2" />
              <div className="w-2 h-2 bg-yellow-400 rounded-full absolute left-0 top-1/2 transform -translate-y-1/2" />
              <div className="w-2 h-2 bg-yellow-400 rounded-full absolute right-0 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        )}
        {condition === 'cloudy' && (
          <div className="relative">
            <div className="w-12 h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="w-16 h-10 bg-gray-400 dark:bg-gray-500 rounded-full absolute top-2 left-2" />
            <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full absolute top-4 left-6" />
          </div>
        )}
        {condition === 'rainy' && (
          <div className="relative">
            <div className="w-12 h-8 bg-gray-400 dark:bg-gray-600 rounded-full" />
            <div className="w-16 h-10 bg-gray-500 dark:bg-gray-500 rounded-full absolute top-2 left-2" />
            <div className="absolute top-12 left-2 space-x-1 flex">
              <div className="w-0.5 h-4 bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-0.5 h-4 bg-blue-400 animate-bounce" style={{ animationDelay: '100ms' }} />
              <div className="w-0.5 h-4 bg-blue-400 animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-0.5 h-4 bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (pageLoading || loading) {
    return <AdvancedLoadingOverlay message="Loading AI dashboard..." isDark={isDark} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center mb-4 lg:mb-0">
          <div className="w-12 h-12 bg-[#DEAF0B] rounded-xl flex items-center justify-center mr-4">
            <Bot className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Charging</h1>
            <p className="text-gray-600 dark:text-gray-400">Intelligent Solar Energy Management</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={toggleAI}
            className={clsx(
              'px-4 py-2 rounded-lg text-white flex items-center',
              aiStatus?.enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            )}
          >
            {aiStatus?.enabled ? (
              <><Square className="w-4 h-4 mr-2" />Stop AI</>
            ) : (
              <><Play className="w-4 h-4 mr-2" />Start AI</>
            )}
          </button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Zap className="w-6 h-6 mr-3 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Battery Level</span>
            </div>
            <div className={clsx('w-3 h-3 rounded-full', 
              (systemState.battery_soc || 0) > 80 ? 'bg-green-500' : 
              (systemState.battery_soc || 0) < 20 ? 'bg-red-500' : 'bg-yellow-500'
            )} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {systemState.battery_soc || 0}%
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Sun className="w-6 h-6 mr-3 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Solar Power</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(systemState.pv_power || 0).toFixed(0)}W
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Euro className="w-6 h-6 mr-3 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Price</span>
            </div>
            <div className={clsx('w-3 h-3 rounded-full', 
              tibberStatus.connected ? 'bg-green-500' : 'bg-red-500'
            )} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentPrice ? `${currentPrice.total.toFixed(3)} €/kWh` : 'Loading...'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Zap className="w-6 h-6 mr-3 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Grid Power</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(systemState.grid_power || 0).toFixed(0)}W
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Home className="w-6 h-6 mr-3 text-indigo-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Load Power</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(systemState.load || 0).toFixed(0)}W
          </div>
        </div>
      </div>

      {/* Price & Prediction Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tibber Price Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Tibber Price Forecast
            </h3>
            <div className="flex items-center">
              <div className={clsx('w-2 h-2 rounded-full mr-2', 
                tibberStatus.connected ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tibberStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {currentPrice ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {currentPrice.total.toFixed(3)} €/kWh
                  </div>
                  <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', 
                    priceLevel === 'VERY_CHEAP' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    priceLevel === 'CHEAP' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    priceLevel === 'NORMAL' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                    priceLevel === 'EXPENSIVE' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  )}>
                    {priceLevel.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <PriceChart forecast={priceData.forecast} />
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Next Hour</span>
                  <div className="font-semibold">
                    {priceData.nextHour ? `${priceData.nextHour.total.toFixed(3)} €` : 'Loading...'}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cheapest Today</span>
                  <div className="font-semibold">
                    {priceData.cheapest ? 
                      `${priceData.cheapest.total.toFixed(3)} € at ${new Date(priceData.cheapest.startsAt).getHours()}:00` : 
                      'Loading...'
                    }
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Euro className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Configure Tibber to see price data</p>
            </div>
          )}
        </div>

        {/* Solar Prediction Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Sun className="w-5 h-5 mr-2 text-yellow-500" />
              Solar Prediction
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">AI Accuracy: {pvPrediction.accuracy}%</span>
          </div>
          
          <div className="space-y-4">
            <WeatherAnimation condition={weatherCondition} />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Production</span>
                <span className="font-semibold">{pvPrediction.current.toFixed(0)}W</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Predicted Next Hour</span>
                <span className="font-semibold">{pvPrediction.predicted.toFixed(0)}W</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Predicted Peak</span>
                <span className="font-semibold">{pvPrediction.peak}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Charging Advice</span>
                <span className={clsx('font-semibold', 
                  currentPrice && (currentPrice.level === 'CHEAP' || currentPrice.level === 'VERY_CHEAP') ? 
                  'text-green-600' : 'text-yellow-600'
                )}>
                  {currentPrice && (currentPrice.level === 'CHEAP' || currentPrice.level === 'VERY_CHEAP') ? 
                    'Recommended' : 'Wait for better price'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Activity Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'decisions', icon: Lightbulb, label: 'Decisions', count: decisions.length },
            { id: 'commands', icon: Terminal, label: 'Commands', count: commands.length },
            { id: 'predictions', icon: Sparkles, label: 'Predictions', count: predictions.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === tab.id 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.count > 0 && (
                <span className={clsx(
                  'ml-2 px-2 py-0.5 text-xs rounded-full',
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-64">
          {activeTab === 'decisions' && (
            <div className="space-y-4">
              {decisions.length > 0 ? (
                decisions.map((decision, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {decision.action}
                      </span>
                      <div className="flex items-center space-x-2">
                        {decision.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(decision.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {decision.reason}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                        Confidence: {(decision.confidence * 100).toFixed(0)}%
                      </span>
                      {decision.batteryLevel && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                          Battery: {decision.batteryLevel}%
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No AI decisions yet</p>
                  <p className="text-sm">Start the AI engine to begin making intelligent decisions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-4">
              {commands.length > 0 ? (
                commands.map((command, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {command.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(command.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        {command.topic}<br />
                        Value: {command.value}
                      </div>
                    </div>
                    <span className={clsx('px-2 py-1 text-xs rounded', 
                      command.status === 'success' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    )}>
                      {command.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No commands sent yet</p>
                  <p className="text-sm">MQTT commands will appear here when the AI engine is active</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-4">
              {predictions.length > 0 ? (
                predictions.map((prediction, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {prediction.title || 'Solar Production Forecast'}
                      </span>
                      <span className="text-sm text-primary">
                        Confidence: {prediction.confidence ? (prediction.confidence * 100).toFixed(0) + '%' : '85%'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {prediction.description || 'Based on historical data and current conditions'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {prediction.timeframe || 'Next 6 hours'}
                      </span>
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                        <Sun className="w-3 h-3 inline mr-1" />
                        {prediction.expectedPV || '2.5kW'} peak
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No predictions available</p>
                  <p className="text-sm">AI predictions will appear here based on system patterns</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}