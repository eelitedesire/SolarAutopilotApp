import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AdvancedLoadingOverlay from './components/AdvancedLoadingOverlay'
import EnergyDashboard from './pages/EnergyDashboard'
import AIDashboard from './pages/AIDashboard'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Chart from './pages/Chart'
import Results from './pages/Results'
import Setup from './pages/Setup'
import ConfigSetup from './pages/ConfigSetup'
import { useTheme } from './hooks/useTheme'
import { useConfigCheck } from './hooks/useConfigCheck'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const { isDark, toggleTheme } = useTheme()
  const { isConfigured, loading: configLoading, checkConfiguration } = useConfigCheck()

  // Apply theme to document immediately
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.body.style.backgroundColor = isDark ? 'rgba(24, 27, 31, 1)' : ''
  }, [isDark])

  useEffect(() => {
    checkSetupStatus()
    
    // Force stop loading after 10 seconds as fallback
    const forceLoadTimeout = setTimeout(() => {
      if (loading || configLoading) {
        console.warn('Force stopping loading after timeout')
        setLoading(false)
      }
    }, 10000)
    
    return () => clearTimeout(forceLoadTimeout)
  }, [isConfigured, loading, configLoading])

  const checkSetupStatus = () => {
    if (!configLoading) {
      const setupComplete = localStorage.getItem('solarautopilot_setup_complete')
      setIsSetupComplete(setupComplete === 'true')
      setLoading(false)
    }
  }

  const handleConfigComplete = (config) => {
    console.log('Configuration completed:', config)
    checkConfiguration()
  }

  const handleSetupComplete = (config) => {
    console.log('Setup completed with config:', config)
    localStorage.setItem('solarautopilot_setup_complete', 'true')
    setIsSetupComplete(true)
  }

  if (loading || configLoading) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <AdvancedLoadingOverlay message="Initializing SolarAutopilot..." isDark={isDark} />
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <Setup onComplete={handleConfigComplete} />
      </div>
    )
  }

  if (!isSetupComplete) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <Setup onComplete={handleSetupComplete} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`} style={{ backgroundColor: isDark ? 'rgba(24, 27, 31, 1)' : '' }}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex h-screen" style={{ backgroundColor: isDark ? 'rgba(24, 27, 31, 1)' : '#f9fafb' }}>
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <main className="flex-1 overflow-x-hidden overflow-y-auto" style={{ backgroundColor: isDark ? 'rgba(24, 27, 31, 1)' : '#f9fafb' }}>
              <div className="container mx-auto px-4 py-8 lg:px-8">
                <Routes>
                  <Route path="/" element={<EnergyDashboard />} />
                  <Route path="/energy-dashboard" element={<EnergyDashboard />} />
                  <Route path="/ai-dashboard" element={<AIDashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/chart" element={<Chart />} />
                  <Route path="/results" element={<Results />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </Router>
    </div>
  )
}

export default App