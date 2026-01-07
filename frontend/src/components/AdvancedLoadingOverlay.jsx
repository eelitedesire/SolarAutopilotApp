import React, { useState, useEffect } from 'react'
import { Leaf, Zap, Sun } from 'lucide-react'

export default function AdvancedLoadingOverlay({ message = "Loading your solar energy dashboard...", isDark = false }) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    "Initializing SolarAutopilot...",
    "Connecting to energy systems...",
    "Loading solar data...",
    "Optimizing AI algorithms...",
    "Preparing dashboard..."
  ]

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        return prev + Math.random() * 15
      })
    }, 200)

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, 800)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" 
         style={{ backgroundColor: isDark ? 'rgba(24, 27, 31, 1)' : '#ffffff' }}>
      
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Main loading content */}
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          
          {/* Logo and spinning icons */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-yellow-400/20 rounded-full animate-spin" 
                   style={{ animationDuration: '3s' }} />
              
              {/* Middle ring */}
              <div className="absolute inset-2 border-4 border-green-400/30 rounded-full animate-spin" 
                   style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              
              {/* Inner content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse overflow-hidden">
                  <img src="https://carbonoz.com/assets/images/image04.jpg?v=8b5d1d9b" alt="CARBONOZ Logo" className="w-12 h-12 object-cover rounded-full" />
                </div>
              </div>
              
              {/* Floating icons */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce" 
                   style={{ animationDelay: '0.5s' }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce" 
                   style={{ animationDelay: '1s' }}>
                <Leaf className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Brand name with gradient */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#DEAF0B' }}>
              CARBONOZ
            </h1>
            <h2 className={`text-xl font-semibold mb-1 ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
              SolarAutopilot
            </h2>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              AI-Powered Solar Energy Management
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className={`w-full rounded-full h-2 mb-3 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
            <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
              {Math.min(Math.round(progress), 100)}% Complete
            </div>
          </div>

          {/* Loading steps */}
          <div className="mb-4">
            <p className={`text-sm font-medium animate-pulse ${isDark ? 'text-white/80' : 'text-gray-800'}`}>
              {steps[currentStep]}
            </p>
          </div>

          {/* Pulsing dots */}
          <div className="flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>

          {/* Additional message */}
          <div className={`mt-6 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            Optimizing your renewable energy experience
          </div>
        </div>

        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
    </div>
  )
}