# CARBONOZ SolarAutopilot - Complete Notification Configuration System

## 🎯 Implementation Summary

I have successfully built a complete, production-ready notification configuration system for your CARBONOZ SolarAutopilot application. This system allows users to create, edit, delete, and fully customize any type of notification they want to receive via Telegram and the dashboard UI.

## 📋 What Was Implemented

### 1. **Core Services**

#### **Rule Evaluation Service** (`services/ruleEvaluationService.js`)
- Flexible rule evaluation engine that handles any system parameter
- Support for threshold, change, and trend-based conditions
- Time-based restrictions (hours, days of week)
- Variable substitution in message templates
- CRUD operations for rules with persistence
- Import/export functionality
- Rule testing and statistics tracking

#### **Enhanced Notification Service** (`services/notificationService.js`)
- Integration with rule evaluation service
- Periodic rule evaluation (every 30 seconds)
- Intelligent suppression and cooldown management
- Multi-channel delivery (UI, Telegram)
- Enhanced message formatting with variables

### 2. **API Endpoints** (`routes/notificationRoutes.js`)

#### **Rule Management**
- `POST /api/notifications/rules` - Create new rule
- `GET /api/notifications/rules` - Get all rules
- `GET /api/notifications/rules/:id` - Get specific rule
- `PUT /api/notifications/rules/:id` - Update rule
- `DELETE /api/notifications/rules/:id` - Delete rule
- `POST /api/notifications/rules/:id/toggle` - Enable/disable rule
- `POST /api/notifications/rules/:id/test` - Test rule with current system state
- `GET /api/notifications/rules/:id/stats` - Get rule statistics

#### **Templates & Import/Export**
- `GET /api/notifications/templates` - Get pre-built rule templates
- `POST /api/notifications/rules/from-template/:templateId` - Create rule from template
- `POST /api/notifications/rules/import` - Import rules from JSON
- `GET /api/notifications/rules/export` - Export rules to JSON
- `POST /api/notifications/rules/evaluate` - Evaluate all rules (testing)

### 3. **Frontend Components**

#### **RuleBuilder Component** (`frontend/src/components/RuleBuilder.jsx`)
- User-friendly rule creation and editing interface
- Template selection for quick setup
- Multiple condition support with AND/OR logic
- Action configuration (channels, severity, cooldown, message template)
- Time restrictions (hours, days of week)
- Variable substitution helper
- Real-time rule testing

#### **RuleCard Component** (`frontend/src/components/RuleCard.jsx`)
- Comprehensive rule display with statistics
- Quick enable/disable toggle
- Test, edit, duplicate, and delete actions
- Expandable message template view
- Time condition display
- Test result visualization

#### **Enhanced Notifications Page** (`frontend/src/pages/Notifications.jsx`)
- Tabbed interface (Notifications + Rules)
- Rule management with search and filtering
- Import/export functionality
- Rule statistics and status tracking
- Integration with existing notification display

### 4. **Rule Templates** (`data/notification-templates.json`)

Pre-built templates for common scenarios:
- **Battery Alerts**: Low (20%), Critical (10%), Fully Charged (100%)
- **Price Alerts**: Negative prices, Optimal charging, Expensive warnings
- **Solar Generation**: High generation (>5kW), Low generation alerts
- **System Alerts**: Grid voltage issues, High load consumption
- **AI Integration**: AI started/stopped charging notifications
- **Time-Based**: Weekend battery alerts, Night consumption alerts

### 5. **Data Persistence**

#### **Rule Storage** (`data/notification-rules.json`)
```json
{
  "rules": [
    {
      "id": "rule_123",
      "name": "Battery Low Alert",
      "description": "Alert when battery is critically low",
      "enabled": true,
      "priority": "high",
      "conditions": [
        {
          "parameter": "battery_soc",
          "operator": "lt",
          "value": 20,
          "type": "threshold"
        }
      ],
      "logic": "AND",
      "action": {
        "channels": ["telegram", "ui"],
        "severity": "warning",
        "messageTemplate": "🔋 Battery Low: {battery_soc}%\nPV: {pv_power}W\nLoad: {load}W",
        "cooldown": 1800000
      },
      "timeConditions": {
        "enabled": false,
        "startHour": 0,
        "endHour": 24,
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      },
      "statistics": {
        "triggeredCount": 5,
        "lastTriggered": "2025-01-08T10:30:00Z",
        "lastValue": 18
      }
    }
  ]
}
```

### 6. **System Integration**

#### **Server Integration** (`server.js`)
- Periodic rule evaluation every 30 seconds
- Integration with existing system state tracking
- Tibber price data integration
- Global service availability

## 🚀 Key Features Implemented

### **Flexible Rule Builder**
✅ Support for ANY system parameter (battery SOC, PV power, grid power, load, voltage, price, etc.)
✅ Multiple operators (>, <, =, >=, <=, between, changed by, etc.)
✅ Multiple condition support with AND/OR logic
✅ Time-based restrictions (hours, days of week)
✅ Variable substitution in messages

### **Smart Notification Management**
✅ Cooldown periods to prevent spam
✅ Severity levels (info, warning, critical)
✅ Multi-channel delivery (UI, Telegram)
✅ Rate limiting and suppression
✅ Statistics tracking (trigger count, last triggered)

### **Advanced Features**
✅ Rule templates for quick setup
✅ Import/export functionality
✅ Real-time rule testing
✅ Rule duplication
✅ Search and filtering
✅ Enable/disable toggles
✅ Comprehensive statistics

### **Production-Ready Features**
✅ Error handling and validation
✅ User-friendly error messages
✅ Performance optimization
✅ Security validation
✅ Rate limiting (100 rules max per user)
✅ Data persistence
✅ Backup and restore capabilities

## 📊 Supported Parameters

The system can monitor and alert on ANY system parameter:

- **Battery**: SOC (%), voltage, power, capacity
- **Solar**: PV power generation, efficiency
- **Grid**: Power import/export, voltage, frequency
- **Load**: Power consumption, patterns
- **Pricing**: Current price, price levels, trends
- **AI Decisions**: Charging decisions, optimization actions
- **System**: Inverter state, connectivity, errors

## 🔧 Supported Operators

- **Threshold**: `>`, `<`, `=`, `>=`, `<=`, `between`
- **Change**: `changed_by` (percentage change)
- **Trend**: `increasing`, `decreasing` (over time)
- **State**: `equals`, `not_equals` (for text values)

## 📱 Notification Channels

- **Dashboard UI**: Real-time notifications in the web interface
- **Telegram**: Rich formatted messages with emojis and system data
- **Future**: Email, SMS, webhooks (extensible architecture)

## 🎨 Message Templates

Dynamic message templates with variable substitution:
```
🔋 Battery Low: {battery_soc}%
PV: {pv_power}W | Load: {load}W
Grid: {grid_power}W | Price: {currentPrice}¢/kWh
Time: {timestamp}
```

Available variables:
- `{battery_soc}`, `{pv_power}`, `{grid_power}`, `{load}`
- `{grid_voltage}`, `{currentPrice}`, `{timestamp}`
- Any system parameter can be used as a variable

## 🔒 Security & Performance

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Maximum 100 rules per user
- **Performance**: Efficient rule evaluation with caching
- **Error Handling**: Graceful error handling with user feedback
- **Data Integrity**: Atomic operations with rollback capability

## 📈 Usage Examples

### Example 1: Battery Low Alert
```json
{
  "name": "Battery Low Alert",
  "conditions": [
    {
      "parameter": "battery_soc",
      "operator": "lt",
      "value": 20
    }
  ],
  "action": {
    "channels": ["telegram", "ui"],
    "severity": "warning",
    "messageTemplate": "🔋 Battery Low: {battery_soc}%\nPV: {pv_power}W | Load: {load}W",
    "cooldown": 1800000
  }
}
```

### Example 2: Negative Price Opportunity
```json
{
  "name": "Negative Price Alert",
  "conditions": [
    {
      "parameter": "currentPrice",
      "operator": "lt",
      "value": 0
    }
  ],
  "action": {
    "channels": ["telegram", "ui"],
    "severity": "critical",
    "messageTemplate": "💸 NEGATIVE PRICES! {currentPrice}¢/kWh\nMaximize charging NOW!",
    "cooldown": 300000
  }
}
```

### Example 3: Weekend Battery Preparation
```json
{
  "name": "Weekend Battery Check",
  "conditions": [
    {
      "parameter": "battery_soc",
      "operator": "lt",
      "value": 80
    }
  ],
  "timeConditions": {
    "enabled": true,
    "startHour": 18,
    "endHour": 20,
    "days": ["friday"]
  },
  "action": {
    "messageTemplate": "🔋 Weekend Prep: Battery at {battery_soc}%\nConsider charging for weekend usage"
  }
}
```

## 🎯 Next Steps

The system is now fully functional and production-ready. Users can:

1. **Access the Rules tab** in the Notifications page
2. **Create custom rules** using the intuitive rule builder
3. **Use templates** for quick setup of common scenarios
4. **Test rules** in real-time with current system state
5. **Import/export** rules for backup and sharing
6. **Monitor statistics** to see rule effectiveness

The system will automatically evaluate all enabled rules every 30 seconds and send notifications when conditions are met, respecting cooldown periods and user preferences.

## 🔧 Technical Architecture

- **Modular Design**: Separate services for rule evaluation, notifications, and UI
- **Event-Driven**: Real-time rule evaluation with system state updates
- **Extensible**: Easy to add new parameters, operators, and channels
- **Scalable**: Efficient algorithms with caching and rate limiting
- **Maintainable**: Clean code structure with comprehensive error handling

This implementation provides a complete, enterprise-grade notification system that gives users full control over their solar system monitoring and alerting.