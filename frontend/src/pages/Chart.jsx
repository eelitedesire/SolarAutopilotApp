import React, { useState, useEffect } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import { usePageLoading } from '../hooks/useLoading'

export default function Chart() {
  const [loading, setLoading] = useState(true)
  const { isDark } = useTheme()
  const { isLoading: pageLoading } = usePageLoading(600, 1200)

  useEffect(() => {
    // Hide loading after iframe loads
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const refreshDashboard = () => {
    setLoading(true)
    const iframe = document.getElementById('grafanaDashboard')
    if (iframe) {
      iframe.src = iframe.src // Force reload
    }
    setTimeout(() => setLoading(false), 1500)
  }

  if (pageLoading) {
    return <AdvancedLoadingOverlay message="Loading chart dashboard..." isDark={isDark} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center mb-4 lg:mb-0">
          <div className="w-12 h-12 bg-[#DEAF0B] rounded-xl flex items-center justify-center mr-4">
            <BarChart3 className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Charts</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time monitoring and historical data visualization
            </p>
          </div>
        </div>
        
        <button
          onClick={refreshDashboard}
          disabled={loading}
          className="btn btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Grafana Dashboard */}
      <div className="card p-0 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="loading-spinner mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        )}
        
        <div className="relative" style={{ height: '80vh', minHeight: '600px' }}>
          <iframe
            id="grafanaDashboard"
            src={`/grafana/d/solar_power_dashboard/solar-power-dashboard?orgId=1&kiosk=1&refresh=5s&theme=${isDark ? 'dark' : 'light'}`}
            className="w-full h-full border-0"
            title="Solar Dashboard"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </div>
      </div>

      {/* Dashboard Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Live monitoring of solar production, battery status, and energy consumption with 1-second refresh rate.
          </p>
        </div>
        
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Historical Analysis</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive historical data analysis with customizable time ranges and detailed performance metrics.
          </p>
        </div>
        
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Interactive Charts</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Interactive Grafana dashboards with zoom, pan, and detailed tooltips for in-depth data exploration.
          </p>
        </div>
      </div>
    </div>
  )
}