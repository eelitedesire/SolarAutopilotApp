import React, { useState, useEffect } from 'react'
import { Leaf, Zap, Sun, Home, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import { usePageLoading } from '../hooks/useLoading'
import { useTheme } from '../hooks/useTheme'

export default function EnergyDashboard() {
  const [systemData, setSystemData] = useState({
    todayData: {
      date: format(new Date(), 'yyyy-MM-dd'),
      avoidedEmissions: 0,
      unavoidableEmissions: 0,
      selfSufficiencyScore: 0,
      gridEnergy: 0,
      solarEnergy: 0,
      carbonIntensity: 0
    },
    summaryData: {
      week: { avoidedEmissions: 0, unavoidableEmissions: 0, selfSufficiencyScore: 0 },
      month: { avoidedEmissions: 0, unavoidableEmissions: 0, selfSufficiencyScore: 0 }
    },
    systemState: {
      battery_soc: 0,
      pv_power: 0,
      grid_power: 0,
      load: 0,
      battery_power: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [warnings, setWarnings] = useState([])
  const [iframeKey, setIframeKey] = useState(0)
  const { isLoading: pageLoading } = usePageLoading(800, 1500)
  const { isDark } = useTheme()

  // Function to update Grafana iframes based on dark mode
  const updateGrafanaIframes = (isDarkMode) => {
    setTimeout(() => {
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach(iframe => {
        let src = iframe.src
        src = src.replace(/([?&]theme=)(light|dark)/, '')
        const separator = src.includes('?') ? '&' : '?'
        const newSrc = `${src}${separator}theme=${isDarkMode ? 'dark' : 'light'}&t=${Date.now()}`
        iframe.src = newSrc
      })
    }, 200)
  }

  // Update iframes when theme changes
  useEffect(() => {
    updateGrafanaIframes(isDark)
  }, [isDark])

  useEffect(() => {
    fetchSystemData()
    const interval = setInterval(fetchSystemData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemData = async () => {
    try {
      // Fetch system state
      const systemResponse = await fetch('/api/system-state')
      const systemData = await systemResponse.json()
      
      // Fetch today's results data
      const todayResponse = await fetch('/api/results/data?period=today')
      const todayResult = await todayResponse.json()
      
      let todayData = {
        date: format(new Date(), 'yyyy-MM-dd'),
        avoidedEmissions: 0,
        unavoidableEmissions: 0,
        selfSufficiencyScore: 0,
        gridEnergy: 0,
        solarEnergy: 0,
        carbonIntensity: 0
      }
      
      if (todayResult.success && todayResult.data.length > 0) {
        const data = todayResult.data[0]
        todayData = {
          date: data.date,
          avoidedEmissions: data.avoidedEmissions || 0,
          unavoidableEmissions: data.unavoidableEmissions || 0,
          selfSufficiencyScore: data.selfSufficiencyScore || 0,
          gridEnergy: data.gridEnergy || 0,
          solarEnergy: data.solarEnergy || 0,
          carbonIntensity: data.carbonIntensity || 0
        }
      }
      
      setSystemData(prev => ({
        ...prev,
        todayData,
        systemState: systemData.current_state || prev.systemState
      }))
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching system data:', error)
      setLoading(false)
    }
  }

  const MetricCard = ({ icon: Icon, title, subtitle, value, trend, trendValue, color, progress }) => (
    <div className="card group hover:scale-105 transition-transform duration-200">
      <div className="card-header">
        <div className={clsx('card-icon', `bg-${color}-500`)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-subtitle">{subtitle}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {value}
        </div>
        {trend && (
          <div className={clsx('flex items-center text-sm', 
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="space-y-2">
          <div className="progress-bar">
            <div 
              className={clsx('progress-fill', `bg-${color}-500`)}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  )



  if (pageLoading || loading) {
    return <AdvancedLoadingOverlay message="Loading energy dashboard..." isDark={isDark} />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#DEAF0B] to-[#c49a0a] rounded-2xl p-8 text-black">
        <div className="flex items-center mb-4">
          <Sun className="w-8 h-8 text-black mr-3" />
          <h1 className="text-3xl font-bold">Welcome to SolarAutopilot</h1>
        </div>
        <p className="text-black/80 text-lg">
          Your solar energy dashboard for {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Power Monitoring Cards with Grafana Integration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Load Power */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Home className="w-5 h-5 mr-2 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Load Power</span>
            </div>
          </div>
          <iframe
            src={`http://localhost:3001/d-solo/solar_power_dashboard/solar-power-dashboard?orgId=1&refresh=5s&panelId=1&theme=${isDark ? 'dark' : 'light'}&kiosk=tv`}
            className="w-full h-48 border-0"
            title="Load Power"
          />
        </div>

        {/* Solar Power */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Sun className="w-5 h-5 mr-2 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Solar Power</span>
            </div>
          </div>
          <iframe
            key={`solar-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_power_dashboard/solar-power-dashboard?orgId=1&refresh=5s&panelId=8&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-48 border-0"
            title="Solar Power"
          />
        </div>

        {/* Battery Power */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-indigo-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Battery Power</span>
            </div>
          </div>
          <iframe
            key={`battery-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_power_dashboard/solar-power-dashboard?orgId=1&refresh=5s&panelId=4&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-48 border-0"
            title="Battery Power"
          />
        </div>

        {/* Grid Power */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Grid Power</span>
            </div>
          </div>
          <iframe
            key={`grid-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_power_dashboard/solar-power-dashboard?orgId=1&refresh=5s&panelId=7&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-48 border-0"
            title="Grid Power"
          />
        </div>
      </div>

      {/* Additional Monitoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Battery SOC */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Battery SOC</span>
            </div>
          </div>
          <iframe
            key={`soc-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_power_dashboard/solar-power-dashboard?orgId=1&refresh=5s&panelId=9&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-48 border-0"
            title="Battery SOC"
          />
        </div>

        {/* Battery Voltage */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Battery Voltage</span>
            </div>
          </div>
          <iframe
            key={`batt-volt-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_power_dashboard/solar-power-dashboard?orgId=1&refresh=5s&panelId=10&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-48 border-0"
            title="Battery Voltage"
          />
        </div>

        {/* Grid Voltage */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-red-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Grid Voltage</span>
            </div>
          </div>
          <iframe
            key={`grid-volt-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_power_dashboard/solar-power-dashboard?orgId=1&refresh=5s&panelId=2&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-48 border-0"
            title="Grid Voltage"
          />
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={Leaf}
          title="Emissions Avoided"
          subtitle="Today's solar contribution"
          value={`${systemData.todayData.avoidedEmissions.toFixed(2)} kg`}
          trend="up"
          trendValue="12% vs weekly average"
          color="green"
          progress={75}
        />
        
        <MetricCard
          icon={Zap}
          title="Emitted CO₂"
          subtitle="Today's grid consumption"
          value={`${systemData.todayData.unavoidableEmissions.toFixed(2)} kg`}
          trend="down"
          trendValue="8% vs weekly average"
          color="red"
          progress={45}
        />
        
        <MetricCard
          icon={Sun}
          title="Self-Sufficiency"
          subtitle="Energy independence score"
          value={`${systemData.todayData.selfSufficiencyScore.toFixed(1)}%`}
          trend="up"
          trendValue="5% vs weekly average"
          color="blue"
          progress={systemData.todayData.selfSufficiencyScore}
        />
      </div>

      {/* Time Series Charts */}
      <div className="space-y-6">
        {/* Battery Power Chart */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Battery power</span>
            </div>
          </div>
          <iframe
            key={`battery-chart-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_dashboard/charts?orgId=1&refresh=5s&panelId=116&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-96 border-0"
            title="Battery Power Chart"
          />
        </div>

        {/* Battery State of Charge Chart */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-500" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Battery state of charge</span>
            </div>
          </div>
          <iframe
            key={`soc-chart-${iframeKey}`}
            src={`http://localhost:3001/d-solo/solar_dashboard/charts?orgId=1&refresh=5s&panelId=139&theme=${isDark ? 'dark' : 'light'}&kiosk=tv&_t=${Date.now()}`}
            className="w-full h-96 border-0"
            title="Battery State of Charge Chart"
          />
        </div>
      </div>



      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              System Warnings
            </h3>
          </div>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <p key={index} className="text-yellow-700 dark:text-yellow-300">
                <strong>{warning.type}:</strong> {warning.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}