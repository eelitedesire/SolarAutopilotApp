import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar, Download, TrendingUp, Zap, Battery, Sun, Grid, BarChart3 } from 'lucide-react';
import AdvancedLoadingOverlay from '../components/AdvancedLoadingOverlay';
import { usePageLoading } from '../hooks/useLoading';
import { useTheme } from '../hooks/useTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement);

// Helper functions for data processing
const safeNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const calculateDailyValues = (loadData, pvData, batteryChargedData, batteryDischargedData, gridUsedData, gridExportedData) => {
  const dailyResults = [];
  
  const dataLength = Math.min(
    loadData.length, pvData.length, batteryChargedData.length,
    batteryDischargedData.length, gridUsedData.length, gridExportedData.length
  );
  
  for (let i = 1; i < dataLength; i++) {
    const currentLoad = safeNumber(loadData[i]?.value);
    const previousLoad = safeNumber(loadData[i - 1]?.value);
    
    const currentPV = safeNumber(pvData[i]?.value);
    const previousPV = safeNumber(pvData[i - 1]?.value);
    
    const currentBatteryCharged = safeNumber(batteryChargedData[i]?.value);
    const previousBatteryCharged = safeNumber(batteryChargedData[i - 1]?.value);
    
    const currentBatteryDischarged = safeNumber(batteryDischargedData[i]?.value);
    const previousBatteryDischarged = safeNumber(batteryDischargedData[i - 1]?.value);
    
    const currentGridUsed = safeNumber(gridUsedData[i]?.value);
    const previousGridUsed = safeNumber(gridUsedData[i - 1]?.value);
    
    const currentGridExported = safeNumber(gridExportedData[i]?.value);
    const previousGridExported = safeNumber(gridExportedData[i - 1]?.value);
    
    // CRITICAL LOGIC: Check if all values for current day are greater than previous day
    const allGreater = 
      (previousLoad === 0 || currentLoad > previousLoad) &&
      (previousPV === 0 || currentPV > previousPV) &&
      (previousBatteryCharged === 0 || currentBatteryCharged > previousBatteryCharged) &&
      (previousBatteryDischarged === 0 || currentBatteryDischarged > previousBatteryDischarged) &&
      (previousGridUsed === 0 || currentGridUsed > previousGridUsed) &&
      (previousGridExported === 0 || currentGridExported > previousGridExported);
    
    const time = loadData[i].time;
    
    if (allGreater) {
      // If all values are greater, calculate the differences
      dailyResults.push({
        date: new Date(time).toISOString().split('T')[0],
        loadPower: currentLoad - previousLoad,
        pvPower: currentPV - previousPV,
        batteryStateOfCharge: currentBatteryCharged - previousBatteryCharged,
        batteryPower: currentBatteryDischarged - previousBatteryDischarged,
        gridPower: currentGridUsed - previousGridUsed,
        gridVoltage: currentGridExported - previousGridExported
      });
    } else {
      // If any value is not greater (counter reset), use current values as is
      dailyResults.push({
        date: new Date(time).toISOString().split('T')[0],
        loadPower: currentLoad,
        pvPower: currentPV,
        batteryStateOfCharge: currentBatteryCharged,
        batteryPower: currentBatteryDischarged,
        gridPower: currentGridUsed,
        gridVoltage: currentGridExported
      });
    }
  }
  
  return dailyResults;
};

const aggregateMonthlyData = (dailyValues) => {
  const monthlyData = {};
  
  dailyValues.forEach(entry => {
    const date = new Date(entry.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`,
        loadPower: 0,
        pvPower: 0,
        batteryStateOfCharge: 0,
        batteryPower: 0,
        gridPower: 0,
        gridVoltage: 0
      };
    }
    
    monthlyData[monthKey].loadPower += safeNumber(entry.loadPower);
    monthlyData[monthKey].pvPower += safeNumber(entry.pvPower);
    monthlyData[monthKey].batteryStateOfCharge += safeNumber(entry.batteryStateOfCharge);
    monthlyData[monthKey].batteryPower += safeNumber(entry.batteryPower);
    monthlyData[monthKey].gridPower += safeNumber(entry.gridPower);
    monthlyData[monthKey].gridVoltage += safeNumber(entry.gridVoltage);
  });
  
  return Object.values(monthlyData).sort((a, b) => new Date(a.date) - new Date(b.date));
};

const aggregateYearlyData = (dailyValues) => {
  const yearlyData = {};
  
  dailyValues.forEach(entry => {
    const date = new Date(entry.date);
    const yearKey = date.getFullYear();
    
    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = {
        date: `${yearKey}-01-01`,
        loadPower: 0,
        pvPower: 0,
        batteryStateOfCharge: 0,
        batteryPower: 0,
        gridPower: 0,
        gridVoltage: 0
      };
    }
    
    yearlyData[yearKey].loadPower += safeNumber(entry.loadPower);
    yearlyData[yearKey].pvPower += safeNumber(entry.pvPower);
    yearlyData[yearKey].batteryStateOfCharge += safeNumber(entry.batteryStateOfCharge);
    yearlyData[yearKey].batteryPower += safeNumber(entry.batteryPower);
    yearlyData[yearKey].gridPower += safeNumber(entry.gridPower);
    yearlyData[yearKey].gridVoltage += safeNumber(entry.gridVoltage);
  });
  
  return Object.values(yearlyData).sort((a, b) => new Date(a.date) - new Date(b.date));
};

const Analytics = () => {
  const [last30DaysData, setLast30DaysData] = useState([]);
  const [last12MonthsData, setLast12MonthsData] = useState([]);
  const [last10YearsData, setLast10YearsData] = useState([]);
  const [activeSection, setActiveSection] = useState('30days');
  const [error, setError] = useState(null);
  const [summaryStats, setSummaryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const { isLoading: pageLoading } = usePageLoading(700, 1300);

  // Add error boundary
  useEffect(() => {
    fetchAllAnalyticsData();
  }, []);

  const fetchAllAnalyticsData = async () => {
    setLoading(true);
    try {
      const [thirtyDaysResponse, twelveMonthsResponse, tenYearsResponse] = await Promise.all([
        fetch('/api/analytics/data?period=month'),
        fetch('/api/analytics/data?period=year'),
        fetch('/api/analytics/data?period=decade')
      ]);
      
      const [thirtyDaysData, twelveMonthsData, tenYearsData] = await Promise.all([
        thirtyDaysResponse.json(),
        twelveMonthsResponse.json(),
        tenYearsResponse.json()
      ]);
      
      if (thirtyDaysData.success) {
        const sortedData = thirtyDaysData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setLast30DaysData(sortedData);
        calculateSummaryStats(sortedData);
      }
      
      if (twelveMonthsData.success) {
        const sortedData = twelveMonthsData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setLast12MonthsData(sortedData);
      }
      
      if (tenYearsData.success) {
        const sortedData = tenYearsData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setLast10YearsData(sortedData);
      }
      
      setError(null);
    } catch (err) {
      setError('Error fetching analytics data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryStats = (data) => {
    if (!data || data.length === 0) return;
    
    const stats = {
      totalLoad: data.reduce((sum, item) => sum + safeNumber(item.loadPower), 0),
      totalSolarPV: data.reduce((sum, item) => sum + safeNumber(item.pvPower), 0),
      totalBatteryCharged: data.reduce((sum, item) => sum + safeNumber(item.batteryStateOfCharge), 0),
      totalBatteryDischarged: data.reduce((sum, item) => sum + safeNumber(item.batteryPower), 0),
      totalGridUsed: data.reduce((sum, item) => sum + safeNumber(item.gridPower), 0),
      totalGridExported: data.reduce((sum, item) => sum + safeNumber(item.gridVoltage), 0),
      selfSufficiencyRatio: 0
    };
    
    if (stats.totalLoad > 0) {
      stats.selfSufficiencyRatio = (stats.totalSolarPV / stats.totalLoad) * 100;
    }
    
    setSummaryStats(stats);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(222, 175, 11);
    doc.text('CARBONOZ Solar Analytics Report', 20, 25);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);
    
    // Add data table
    if (last30DaysData.length > 0) {
      const tableData = last30DaysData.map(item => [
        new Date(item.date).toLocaleDateString(),
        safeNumber(item.loadPower).toFixed(2),
        safeNumber(item.pvPower).toFixed(2),
        safeNumber(item.batteryStateOfCharge).toFixed(2),
        safeNumber(item.batteryPower).toFixed(2),
        safeNumber(item.gridPower).toFixed(2),
        safeNumber(item.gridVoltage).toFixed(2)
      ]);

      doc.autoTable({
        head: [['Date', 'Load', 'Solar PV', 'Battery Charged', 'Battery Discharged', 'Grid Used', 'Grid Exported']],
        body: tableData,
        startY: 60,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [222, 175, 11] }
      });
    }
    
    doc.save(`carbonoz-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const createChartData = (data, reverse = false) => {
    const chartData = reverse ? [...data].reverse() : data;
    return {
      labels: chartData.map(item => {
        const date = new Date(item.date);
        if (data === last10YearsData) {
          return date.getFullYear().toString();
        } else if (data === last12MonthsData) {
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        } else {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }),
      datasets: [
        {
          label: 'Load',
          data: chartData.map(item => safeNumber(item.loadPower)),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          borderWidth: 2
        },
        {
          label: 'Grid',
          data: chartData.map(item => safeNumber(item.gridPower)),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          borderWidth: 2
        },
        {
          label: 'Solar PV',
          data: chartData.map(item => safeNumber(item.pvPower)),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          borderWidth: 2
        }
      ]
    };
  };

  const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: '500' },
          color: isDark ? '#D1D5DB' : '#6B7280'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#fff' : '#000',
        bodyColor: isDark ? '#fff' : '#000',
        borderColor: '#DEAF0B',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kWh`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDark ? '#D1D5DB' : '#6B7280',
          font: { size: 11 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: isDark ? '#D1D5DB' : '#6B7280',
          font: { size: 11 },
          callback: function(value) {
            return value.toFixed(0) + 'k';
          }
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: '#fff',
        hoverBorderWidth: 2
      }
    }
  });

  const renderDataTable = (data, title) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{data.length} records (newest first)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Load (kWh)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Solar PV (kWh)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Battery Charged (kWh)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Battery Discharged (kWh)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Grid Used (kWh)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Grid Exported (kWh)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {new Date(item.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                  {safeNumber(item.loadPower).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                  {safeNumber(item.pvPower).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-600 font-medium">
                  {safeNumber(item.batteryStateOfCharge).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                  {safeNumber(item.batteryPower).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                  {safeNumber(item.gridPower).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                  {safeNumber(item.gridVoltage).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (pageLoading || loading) {
    return <AdvancedLoadingOverlay message="Loading analytics data..." isDark={isDark} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Solar Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Energy analysis with proper counter reset handling</p>
            </div>
            <button onClick={generatePDF} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Solar PV Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Today's Solar PV */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Today's Solar PV</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Current Day Production</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Sun className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {last30DaysData.length > 0 ? safeNumber(last30DaysData[0]?.pvPower).toFixed(1) : '0.0'} kWh
            </div>
            <div className="h-12 relative bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-md p-1">
              <Line 
                data={{
                  labels: last30DaysData.slice(0, 7).reverse().map((_, i) => `Day ${i + 1}`),
                  datasets: [{
                    data: last30DaysData.slice(0, 7).reverse().map(item => safeNumber(item.pvPower)),
                    borderColor: '#FBBF24',
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#FBBF24',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 1,
                    borderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false }
                  },
                  elements: { point: { hoverRadius: 4 } }
                }}
              />
            </div>
          </div>

          {/* Last 7 Days Solar PV */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Last 7 Days Solar PV</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Weekly Production Total</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {last30DaysData.slice(0, 7).reduce((sum, item) => sum + safeNumber(item.pvPower), 0).toFixed(1)} kWh
            </div>
            <div className="h-12 relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-md p-1">
              <Line 
                data={{
                  labels: last30DaysData.slice(0, 7).reverse().map((_, i) => `Day ${i + 1}`),
                  datasets: [{
                    data: last30DaysData.slice(0, 7).reverse().map(item => safeNumber(item.pvPower)),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 1,
                    borderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false }
                  },
                  elements: { point: { hoverRadius: 4 } }
                }}
              />
            </div>
          </div>

          {/* Last 30 Days Solar PV */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Last 30 Days Solar PV</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Monthly Production Total</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {summaryStats.totalSolarPV?.toFixed(1) || '0.0'} kWh
            </div>
            <div className="h-12 relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-md p-1">
              <Line 
                data={{
                  labels: last30DaysData.slice(0, 15).reverse().map((_, i) => `Day ${i + 1}`),
                  datasets: [{
                    data: last30DaysData.slice(0, 15).reverse().map(item => safeNumber(item.pvPower)),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 1,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 1,
                    borderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { display: false }
                  },
                  elements: { point: { hoverRadius: 4 } }
                }}
              />
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center ${
                activeSection === '30days' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setActiveSection('30days')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center ${
                activeSection === '12months' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setActiveSection('12months')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Last 12 Months
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center ${
                activeSection === '10years' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setActiveSection('10years')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Last 10 Years
            </button>
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === '30days' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Last 30 Days Analysis</h2>
            
            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">30-Day Energy Trends</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">Time: {new Date().toLocaleDateString()}</div>
              </div>
              <div key={isDark} className="h-80 p-4" style={{ backgroundColor: isDark ? 'rgb(32, 36, 41)' : '#ffffff' }}>
                <Line data={createChartData(last30DaysData, true)} options={getChartOptions()} />
              </div>
            </div>
            
            {/* Table */}
            {renderDataTable(last30DaysData, 'Last 30 Days - Daily Energy Data')}
          </div>
        )}

        {activeSection === '12months' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Last 12 Months Analysis</h2>
            
            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">12-Month Energy Trends</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">Time: {new Date().toLocaleDateString()}</div>
              </div>
              <div key={isDark} className="h-80 p-4" style={{ backgroundColor: isDark ? 'rgb(32, 36, 41)' : '#ffffff' }}>
                <Line data={createChartData(last12MonthsData, true)} options={getChartOptions()} />
              </div>
            </div>
            
            {/* Table */}
            {renderDataTable(last12MonthsData, 'Last 12 Months - Monthly Energy Data')}
          </div>
        )}

        {activeSection === '10years' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Last 10 Years Analysis</h2>
            
            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">10-Year Energy Trends</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">Time: {new Date().toLocaleDateString()}</div>
              </div>
              <div key={isDark} className="h-80 p-4" style={{ backgroundColor: isDark ? 'rgb(32, 36, 41)' : '#ffffff' }}>
                <Line data={createChartData(last10YearsData, true)} options={getChartOptions()} />
              </div>
            </div>
            
            {/* Table */}
            {renderDataTable(last10YearsData, 'Last 10 Years - Yearly Energy Data')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;