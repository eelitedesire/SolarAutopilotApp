import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, TestTube, Copy } from 'lucide-react'
import clsx from 'clsx'

const RuleBuilder = ({ isOpen, onClose, rule = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 'medium',
    conditions: [{ parameter: 'battery_soc', operator: 'lt', value: '', type: 'threshold' }],
    logic: 'AND',
    action: {
      channels: ['ui'],
      severity: 'info',
      messageTemplate: '',
      cooldown: 300000
    },
    timeConditions: {
      enabled: false,
      startHour: 0,
      endHour: 24,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }
  })

  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [testResult, setTestResult] = useState(null)

  const parameters = [
    { value: 'battery_soc', label: 'Battery SOC (%)', unit: '%' },
    { value: 'pv_power', label: 'PV Power', unit: 'W' },
    { value: 'grid_power', label: 'Grid Power', unit: 'W' },
    { value: 'load', label: 'Load Power', unit: 'W' },
    { value: 'grid_voltage', label: 'Grid Voltage', unit: 'V' },
    { value: 'currentPrice', label: 'Electricity Price', unit: '¢/kWh' },
    { value: 'inverter_state', label: 'Inverter State', unit: '' }
  ]

  const operators = [
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'gte', label: 'Greater than or equal (≥)' },
    { value: 'lt', label: 'Less than (<)' },
    { value: 'lte', label: 'Less than or equal (≤)' },
    { value: 'eq', label: 'Equal to (=)' },
    { value: 'ne', label: 'Not equal to (≠)' },
    { value: 'between', label: 'Between' }
  ]

  const severities = [
    { value: 'info', label: 'Info', color: 'blue' },
    { value: 'warning', label: 'Warning', color: 'yellow' },
    { value: 'critical', label: 'Critical', color: 'red' }
  ]

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ]

  const channels = [
    { value: 'ui', label: 'Dashboard UI' },
    { value: 'telegram', label: 'Telegram' }
  ]

  const days = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  useEffect(() => {
    if (rule) {
      setFormData(rule)
    }
    loadTemplates()
  }, [rule])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/notifications/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData({
        ...template.template,
        name: template.template.name,
        description: template.template.description
      })
    }
    setSelectedTemplate(templateId)
  }

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { parameter: 'battery_soc', operator: 'lt', value: '', type: 'threshold' }]
    }))
  }

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }))
  }

  const updateCondition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }))
  }

  const handleChannelToggle = (channel) => {
    setFormData(prev => ({
      ...prev,
      action: {
        ...prev.action,
        channels: prev.action.channels.includes(channel)
          ? prev.action.channels.filter(c => c !== channel)
          : [...prev.action.channels, channel]
      }
    }))
  }

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      timeConditions: {
        ...prev.timeConditions,
        days: prev.timeConditions.days.includes(day)
          ? prev.timeConditions.days.filter(d => d !== day)
          : [...prev.timeConditions.days, day]
      }
    }))
  }

  const testRule = async () => {
    try {
      if (rule?.id) {
        const response = await fetch(`/api/notifications/rules/${rule.id}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        const data = await response.json()
        setTestResult(data.testResult)
      } else {
        setTestResult({ wouldTrigger: false, message: 'Save rule first to test' })
      }
    } catch (error) {
      console.error('Error testing rule:', error)
    }
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a rule name')
      return
    }
    if (formData.conditions.length === 0) {
      alert('Please add at least one condition')
      return
    }
    if (!formData.action.messageTemplate.trim()) {
      alert('Please enter a message template')
      return
    }

    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {rule ? 'Edit Rule' : 'Create Notification Rule'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Selection */}
          {!rule && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start from Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Create from scratch</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Enter rule name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              rows={2}
              placeholder="Describe what this rule does"
            />
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conditions</h3>
              <button
                onClick={addCondition}
                className="btn btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
              </button>
            </div>

            {formData.conditions.map((condition, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Parameter
                    </label>
                    <select
                      value={condition.parameter}
                      onChange={(e) => updateCondition(index, 'parameter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {parameters.map(param => (
                        <option key={param.value} value={param.value}>
                          {param.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Operator
                    </label>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Value
                    </label>
                    <input
                      type="number"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Enter value"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => removeCondition(index)}
                      className="btn btn-secondary text-red-600 hover:text-red-700"
                      disabled={formData.conditions.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {formData.conditions.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logic
                </label>
                <select
                  value={formData.logic}
                  onChange={(e) => setFormData(prev => ({ ...prev, logic: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="AND">ALL conditions must be true (AND)</option>
                  <option value="OR">ANY condition must be true (OR)</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Action</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severity
                </label>
                <select
                  value={formData.action.severity}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    action: { ...prev.action, severity: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  {severities.map(severity => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cooldown (minutes)
                </label>
                <input
                  type="number"
                  value={formData.action.cooldown / 60000}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    action: { ...prev.action, cooldown: (parseFloat(e.target.value) || 5) * 60000 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  min="1"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Channels
              </label>
              <div className="flex flex-wrap gap-3">
                {channels.map(channel => (
                  <label key={channel.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.action.channels.includes(channel.value)}
                      onChange={() => handleChannelToggle(channel.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {channel.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Template *
              </label>
              <textarea
                value={formData.action.messageTemplate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  action: { ...prev.action, messageTemplate: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                rows={3}
                placeholder="Enter message template. Use {battery_soc}, {pv_power}, {currentPrice}, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {'{battery_soc}, {pv_power}, {grid_power}, {load}, {grid_voltage}, {currentPrice}, {timestamp}'}
              </p>
            </div>
          </div>

          {/* Time Conditions */}
          <div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={formData.timeConditions.enabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  timeConditions: { ...prev.timeConditions, enabled: e.target.checked }
                }))}
                className="mr-3"
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Time Restrictions (Optional)
              </h3>
            </div>

            {formData.timeConditions.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Hour
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.timeConditions.startHour}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        timeConditions: { ...prev.timeConditions, startHour: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Hour
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={formData.timeConditions.endHour}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        timeConditions: { ...prev.timeConditions, endHour: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Active Days
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {days.map(day => (
                      <label key={day.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.timeConditions.days.includes(day.value)}
                          onChange={() => handleDayToggle(day.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {day.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={clsx(
              'p-4 rounded-lg border',
              testResult.wouldTrigger 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
            )}>
              <h4 className="font-semibold mb-2">Test Result</h4>
              <p className="text-sm mb-2">
                Rule would {testResult.wouldTrigger ? 'TRIGGER' : 'NOT trigger'} with current system state
              </p>
              {testResult.wouldTrigger && (
                <p className="text-sm font-mono bg-white dark:bg-gray-700 p-2 rounded">
                  {testResult.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            {rule && (
              <button onClick={testRule} className="btn btn-secondary">
                <TestTube className="w-4 h-4 mr-2" />
                Test Rule
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RuleBuilder