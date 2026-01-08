import React, { useState } from 'react'
import { 
  Edit, 
  Trash2, 
  TestTube, 
  Copy, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  MessageSquare,
  Calendar,
  TrendingUp
} from 'lucide-react'
import clsx from 'clsx'

const RuleCard = ({ rule, onEdit, onDelete, onToggle, onTest, onDuplicate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return AlertCircle
      case 'warning': return AlertTriangle
      case 'info': return Info
      default: return Info
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatCondition = (condition) => {
    const parameterLabels = {
      battery_soc: 'Battery SOC',
      pv_power: 'PV Power',
      grid_power: 'Grid Power',
      load: 'Load',
      grid_voltage: 'Grid Voltage',
      currentPrice: 'Price'
    }

    const operatorLabels = {
      gt: '>',
      gte: '≥',
      lt: '<',
      lte: '≤',
      eq: '=',
      ne: '≠',
      between: 'between'
    }

    const param = parameterLabels[condition.parameter] || condition.parameter
    const op = operatorLabels[condition.operator] || condition.operator
    
    return `${param} ${op} ${condition.value}`
  }

  const formatCooldown = (cooldown) => {
    const minutes = cooldown / 60000
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const handleTest = async () => {
    try {
      const result = await onTest(rule.id)
      setTestResult(result)
      setTimeout(() => setTestResult(null), 5000)
    } catch (error) {
      console.error('Error testing rule:', error)
    }
  }

  const SeverityIcon = getSeverityIcon(rule.action.severity)

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 hover:shadow-lg',
      rule.enabled 
        ? 'border-gray-200 dark:border-gray-700' 
        : 'border-gray-100 dark:border-gray-800 opacity-60'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={clsx('p-2 rounded-lg', getSeverityColor(rule.action.severity))}>
              <SeverityIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {rule.name}
                </h3>
                <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', getPriorityColor(rule.priority))}>
                  {rule.priority}
                </span>
                {!rule.enabled && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {rule.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {rule.statistics.triggeredCount} triggers
                </span>
                {rule.statistics.lastTriggered && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(rule.statistics.lastTriggered).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {rule.action.channels.join(', ')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onToggle(rule.id)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                rule.enabled 
                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                  : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
              title={rule.enabled ? 'Disable rule' : 'Enable rule'}
            >
              {rule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={handleTest}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Test rule"
            >
              <TestTube className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(rule)}
              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit rule"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(rule)}
              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Duplicate rule"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete rule"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conditions Summary */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conditions</h4>
          <div className="flex flex-wrap gap-2">
            {rule.conditions.map((condition, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
                {formatCondition(condition)}
              </span>
            ))}
            {rule.conditions.length > 1 && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md font-medium">
                {rule.logic}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Severity:</span>
            <span className={clsx('ml-2 font-medium', 
              rule.action.severity === 'critical' ? 'text-red-600' :
              rule.action.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
            )}>
              {rule.action.severity}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Cooldown:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {formatCooldown(rule.action.cooldown)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Channels:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {rule.action.channels.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Time Restricted:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {rule.timeConditions.enabled ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Time Conditions */}
        {rule.timeConditions.enabled && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                Active {rule.timeConditions.startHour}:00 - {rule.timeConditions.endHour}:00 on{' '}
                {rule.timeConditions.days.length === 7 ? 'all days' : rule.timeConditions.days.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Expandable Message Template */}
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isExpanded ? 'Hide' : 'Show'} message template
          </button>
          {isExpanded && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                {rule.action.messageTemplate}
              </pre>
            </div>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={clsx(
            'mt-3 p-3 rounded-lg border',
            testResult.wouldTrigger 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
              : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
          )}>
            <div className="flex items-center mb-2">
              <TestTube className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Test Result: {testResult.wouldTrigger ? 'WOULD TRIGGER' : 'WOULD NOT TRIGGER'}
              </span>
            </div>
            {testResult.wouldTrigger && testResult.message && (
              <div className="text-sm bg-white dark:bg-gray-700 p-2 rounded border font-mono">
                {testResult.message}
              </div>
            )}
            {testResult.conditions && (
              <div className="mt-2 space-y-1">
                {testResult.conditions.map((condition, index) => (
                  <div key={index} className="text-xs flex items-center justify-between">
                    <span>{formatCondition(condition)}</span>
                    <span className={clsx(
                      'px-2 py-1 rounded',
                      condition.result 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    )}>
                      {condition.result ? '✓' : '✗'} ({condition.currentValue})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RuleCard