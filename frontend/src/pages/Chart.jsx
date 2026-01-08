import React, { useState, useEffect, useRef } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import { usePageLoading } from '../hooks/useLoading'

export default function Chart() {
  const [loading, setLoading] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)
  const { isDark } = useTheme()
  const { isLoading: pageLoading } = usePageLoading(600, 1200)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Force iframe recreation when theme changes
  useEffect(() => {
    setLoading(true)
    // Small delay to ensure theme change is processed
    const timer = setTimeout(() => {
      setIframeKey(prev => prev + 1)
    }, 100)
    return () => clearTimeout(timer)
  }, [isDark])

  const refreshDashboard = () => {
    setLoading(true)
    setIframeKey(prev => prev + 1)
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
              Real-time monitoring and comprehensive analytics
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

      {/* Main Grafana Dashboard */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 200px)', minHeight: '700px' }}>
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="text-center">
              <div className="loading-spinner mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        )}
        
        <iframe
          key={iframeKey}
          src={`http://localhost:3001/d/solar_dashboard/solar_dashboard?orgId=1&kiosk=1&refresh=5s&theme=${isDark ? 'dark' : 'light'}`}
          className="w-full h-full border-0 rounded-xl shadow-lg"
          title="Solar Power Dashboard"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </div>

      {/* Dashboard Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Live Monitoring</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time data with automatic 5-second refresh for instant system insights.
          </p>
        </div>
        
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Interactive Charts</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Zoom, pan, and explore detailed metrics with professional Grafana visualizations.
          </p>
        </div>
        
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Adaptive Theme</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dashboard automatically adapts to your preferred light or dark theme.
          </p>
        </div>
      </div>
    </div>
  )
}