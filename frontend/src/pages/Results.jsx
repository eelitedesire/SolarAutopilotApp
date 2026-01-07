import React, { useState, useEffect } from 'react'
import { 
  Leaf, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  FileText, 
  Calendar,
  BarChart3,
  PieChart,
  Gauge
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import clsx from 'clsx'
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay'
import { usePageLoading } from '../hooks/useLoading'
import { useTheme } from '../hooks/useTheme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Results() {
  const [data, setData] = useState({
    today: [],
    week: [],
    month: [],
    quarter: [],
    year: []
  })
  const [selectedPeriod, setSelectedPeriod] = useState('day')
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(25)
  const [loading, setLoading] = useState(true)
  const { isDark } = useTheme()
  const { isLoading: pageLoading } = usePageLoading(700, 1300)

  const periods = [
    { id: 'day', label: 'Today', icon: Calendar },
    { id: 'week', label: 'Week', icon: Calendar },
    { id: 'month', label: 'Month', icon: Calendar },
    { id: 'quarter', label: 'Quarter', icon: Calendar },
    { id: 'year', label: 'Year', icon: Calendar }
  ]

  useEffect(() => {
    loadPeriodData()
  }, [selectedPeriod])

  const loadPeriodData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/results/data?period=${selectedPeriod}`)
      const result = await response.json()
      if (result.success) {
        setData(prev => ({ ...prev, [selectedPeriod]: result.data }))
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading period data:', error)
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const currentData = data[selectedPeriod] || []
    const totalEmissions = currentData.reduce((sum, d) => sum + (d.unavoidableEmissions || 0), 0)
    const totalAvoided = currentData.reduce((sum, d) => sum + (d.avoidedEmissions || 0), 0)
    const avgEfficiency = currentData.reduce((sum, d) => sum + (d.selfSufficiencyScore || 0), 0) / Math.max(1, currentData.length)
    const totalSolar = currentData.reduce((sum, d) => sum + (d.solarEnergy || 0), 0)
    const avgCarbon = currentData.reduce((sum, d) => sum + (d.carbonIntensity || 233), 0) / Math.max(1, currentData.length)

    return {
      emissions: totalEmissions,
      avoided: totalAvoided,
      efficiency: avgEfficiency,
      solar: totalSolar,
      carbon: avgCarbon
    }
  }

  const getChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#1e293b',
          font: { size: 12, weight: '500' }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#DEAF0B',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#DEAF0B',
          font: { weight: '500' }
        }
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#DEAF0B',
          font: { weight: '500' }
        }
      }
    }
  })

  const exportToCSV = () => {
    const currentData = data[selectedPeriod] || []
    const csv = [
      'Date,Solar Energy (kWh),Grid Energy (kWh),Emissions (kg CO₂),Avoided (kg CO₂),Efficiency (%)',
      ...currentData.map(row => 
        `${row.date},${row.solarEnergy || 0},${row.gridEnergy || 0},${row.unavoidableEmissions || 0},${row.avoidedEmissions || 0},${row.selfSufficiencyScore || 0}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carbon-results-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('CARBONOZ Carbon Intensity Results', 20, 30)
    
    doc.setFontSize(14)
    doc.text(`Period: ${selectedPeriod}`, 20, 45)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55)
    
    const stats = calculateStats()
    doc.setFontSize(12)
    doc.text('Summary Statistics:', 20, 75)
    doc.text(`Total Emissions: ${stats.emissions.toFixed(2)} kg CO₂`, 30, 85)
    doc.text(`Avoided Emissions: ${stats.avoided.toFixed(2)} kg CO₂`, 30, 95)
    doc.text(`Average Efficiency: ${stats.efficiency.toFixed(1)}%`, 30, 105)
    
    doc.save(`carbon-results-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const StatCard = ({ icon: Icon, title, value, unit, color = 'blue' }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <Icon className={clsx('w-6 h-6', `text-${color}-500`)} />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}{unit}
      </div>
    </div>
  )

  const GaugeCard = ({ title, value, max, color, unit }) => (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Gauge className="w-5 h-5 mr-2" />
        {title}
      </h3>
      <div className="relative h-32 flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(value / max) * 251.2} 251.2`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {value.toFixed(0)}{unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  if (pageLoading || loading) {
    return <AdvancedLoadingOverlay message="Loading results data..." isDark={isDark} />
  }

  const stats = calculateStats()
  const currentData = data[selectedPeriod] || []

  // Chart data
  const energyFlowData = {
    labels: currentData.slice(-30).map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Solar Energy',
        data: currentData.slice(-30).map(d => d.solarEnergy || 0),
        borderColor: '#FFA500',
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Grid Energy',
        data: currentData.slice(-30).map(d => d.gridEnergy || 0),
        borderColor: '#9C27B0',
        backgroundColor: 'rgba(156, 39, 176, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  }

  const emissionsData = {
    labels: ['Unavoidable Emissions', 'Avoided Emissions'],
    datasets: [{
      data: [stats.emissions, stats.avoided],
      backgroundColor: ['#f5576c', '#38f9d7'],
      borderWidth: 0
    }]
  }

  const paginatedData = currentData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Carbon Intensity Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Environmental impact analysis and carbon footprint tracking
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {periods.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  selectedPeriod === period.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
          <button onClick={exportToCSV} className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
          <button onClick={exportToPDF} className="btn btn-secondary">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Leaf}
          title="Total Emissions"
          value={stats.emissions.toFixed(2)}
          unit=" kg CO₂"
          color="red"
        />
        <StatCard
          icon={Leaf}
          title="Avoided Emissions"
          value={stats.avoided.toFixed(2)}
          unit=" kg CO₂"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Self-Sufficiency"
          value={stats.efficiency.toFixed(1)}
          unit="%"
          color="blue"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Energy Flow & Emissions
          </h3>
          <div className="h-80">
            <Line data={energyFlowData} options={getChartOptions('Energy Flow')} />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Emissions Breakdown
          </h3>
          <div className="h-80">
            <Doughnut data={emissionsData} options={getChartOptions('Emissions')} />
          </div>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GaugeCard
          title="Carbon Intensity"
          value={stats.carbon}
          max={500}
          color="#f5576c"
          unit=" g/kWh"
        />
        <GaugeCard
          title="Solar Energy"
          value={stats.solar}
          max={Math.max(stats.solar * 1.5, 50)}
          color="#38f9d7"
          unit=" kWh"
        />
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Energy Data</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Show
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="ml-2 mr-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              entries
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Solar Energy (kWh)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Grid Energy (kWh)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Emissions (kg CO₂)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Avoided (kg CO₂)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Efficiency (%)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Trend</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((row, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{(row.solarEnergy || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">{(row.gridEnergy || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">{(row.unavoidableEmissions || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">{(row.avoidedEmissions || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">{(row.selfSufficiencyScore || 0).toFixed(1)}%</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <TrendingUp className="w-3 h-3 mr-1" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, currentData.length)} of {currentData.length} entries
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(currentData.length / entriesPerPage)}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}