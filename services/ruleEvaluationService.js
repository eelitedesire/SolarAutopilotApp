// Rule Evaluation Service for CARBONOZ SolarAutopilot
// Handles flexible notification rule evaluation and processing

const fs = require('fs');
const path = require('path');

class RuleEvaluationService {
    constructor() {
        this.rules = new Map();
        this.ruleStates = new Map(); // Track rule state for change detection
        this.cooldowns = new Map(); // Track cooldown periods
        this.rulesFilePath = path.join(__dirname, '../data/notification-rules.json');
        this.loadRules();
    }

    // Load rules from file
    loadRules() {
        try {
            if (fs.existsSync(this.rulesFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.rulesFilePath, 'utf8'));
                data.rules.forEach(rule => {
                    this.rules.set(rule.id, rule);
                });
                console.log(`Loaded ${this.rules.size} notification rules`);
            } else {
                this.createDefaultRules();
            }
        } catch (error) {
            console.error('Error loading notification rules:', error);
            this.createDefaultRules();
        }
    }

    // Save rules to file
    saveRules() {
        try {
            const dataDir = path.dirname(this.rulesFilePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const data = {
                rules: Array.from(this.rules.values()),
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.rulesFilePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving notification rules:', error);
        }
    }

    // Create default rules
    createDefaultRules() {
        const defaultRules = [
            {
                id: 'battery_low_alert',
                name: 'Battery Low Alert',
                description: 'Alert when battery SOC is below 20%',
                enabled: true,
                priority: 'high',
                conditions: [{
                    parameter: 'battery_soc',
                    operator: 'lt',
                    value: 20,
                    type: 'threshold'
                }],
                logic: 'AND',
                action: {
                    channels: ['telegram', 'ui'],
                    severity: 'warning',
                    messageTemplate: '🔋 Battery Low: {battery_soc}%\nPV: {pv_power}W | Load: {load}W',
                    cooldown: 1800000 // 30 minutes
                },
                timeConditions: { enabled: false },
                statistics: { triggeredCount: 0, lastTriggered: null },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'negative_price_alert',
                name: 'Negative Price Alert',
                description: 'Alert when electricity prices go negative',
                enabled: true,
                priority: 'critical',
                conditions: [{
                    parameter: 'currentPrice',
                    operator: 'lt',
                    value: 0,
                    type: 'threshold'
                }],
                logic: 'AND',
                action: {
                    channels: ['telegram', 'ui'],
                    severity: 'critical',
                    messageTemplate: '💸 Negative Prices! {currentPrice}¢/kWh\nMaximize charging now!',
                    cooldown: 300000 // 5 minutes
                },
                timeConditions: { enabled: false },
                statistics: { triggeredCount: 0, lastTriggered: null },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'high_solar_generation',
                name: 'High Solar Generation',
                description: 'Alert when PV power exceeds 5kW',
                enabled: true,
                priority: 'medium',
                conditions: [{
                    parameter: 'pv_power',
                    operator: 'gt',
                    value: 5000,
                    type: 'threshold'
                }],
                logic: 'AND',
                action: {
                    channels: ['ui'],
                    severity: 'info',
                    messageTemplate: '☀️ High Solar: {pv_power}W\nExcellent generation conditions!',
                    cooldown: 3600000 // 1 hour
                },
                timeConditions: { enabled: false },
                statistics: { triggeredCount: 0, lastTriggered: null },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        defaultRules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });

        this.saveRules();
    }

    // Evaluate all enabled rules against current system state
    evaluateRules(systemState, tibberData) {
        const triggeredRules = [];
        const now = Date.now();

        for (const rule of this.rules.values()) {
            if (!rule.enabled) continue;

            // Check cooldown
            const lastTriggered = this.cooldowns.get(rule.id);
            if (lastTriggered && (now - lastTriggered) < rule.action.cooldown) {
                continue;
            }

            // Check time conditions
            if (rule.timeConditions.enabled && !this.isWithinTimeConditions(rule.timeConditions)) {
                continue;
            }

            // Evaluate conditions
            if (this.evaluateConditions(rule, systemState, tibberData)) {
                triggeredRules.push(rule);
                this.updateRuleStatistics(rule);
                this.cooldowns.set(rule.id, now);
            }
        }

        return triggeredRules;
    }

    // Evaluate rule conditions
    evaluateConditions(rule, systemState, tibberData) {
        const results = rule.conditions.map(condition => {
            const value = this.getParameterValue(condition.parameter, systemState, tibberData);
            if (value === null || value === undefined) return false;

            return this.evaluateCondition(condition, value, systemState);
        });

        // Apply logic (AND/OR)
        if (rule.logic === 'OR') {
            return results.some(result => result);
        } else {
            return results.every(result => result);
        }
    }

    // Evaluate single condition
    evaluateCondition(condition, currentValue, systemState) {
        const { operator, value, type } = condition;

        switch (type) {
            case 'threshold':
                return this.evaluateThreshold(operator, currentValue, value);
            case 'change':
                return this.evaluateChange(condition, currentValue, systemState);
            case 'trend':
                return this.evaluateTrend(condition, currentValue, systemState);
            default:
                return this.evaluateThreshold(operator, currentValue, value);
        }
    }

    // Evaluate threshold conditions
    evaluateThreshold(operator, currentValue, targetValue) {
        switch (operator) {
            case 'gt': return currentValue > targetValue;
            case 'gte': return currentValue >= targetValue;
            case 'lt': return currentValue < targetValue;
            case 'lte': return currentValue <= targetValue;
            case 'eq': return currentValue === targetValue;
            case 'ne': return currentValue !== targetValue;
            case 'between':
                return Array.isArray(targetValue) && 
                       currentValue >= targetValue[0] && 
                       currentValue <= targetValue[1];
            default: return false;
        }
    }

    // Evaluate change conditions (value changed by X%)
    evaluateChange(condition, currentValue, systemState) {
        const { parameter, value: changePercent } = condition;
        const previousValue = this.ruleStates.get(`${parameter}_previous`);
        
        if (previousValue === undefined) {
            this.ruleStates.set(`${parameter}_previous`, currentValue);
            return false;
        }

        const changeAmount = Math.abs(currentValue - previousValue);
        const changePercentActual = (changeAmount / previousValue) * 100;
        
        this.ruleStates.set(`${parameter}_previous`, currentValue);
        
        return changePercentActual >= changePercent;
    }

    // Evaluate trend conditions (increasing/decreasing over time)
    evaluateTrend(condition, currentValue, systemState) {
        const { parameter, value: trendType } = condition;
        const historyKey = `${parameter}_history`;
        
        let history = this.ruleStates.get(historyKey) || [];
        history.push({ value: currentValue, timestamp: Date.now() });
        
        // Keep only last 10 minutes of data
        const tenMinutesAgo = Date.now() - 600000;
        history = history.filter(item => item.timestamp > tenMinutesAgo);
        
        this.ruleStates.set(historyKey, history);
        
        if (history.length < 3) return false;
        
        // Check trend
        const values = history.map(item => item.value);
        const isIncreasing = values.every((val, i) => i === 0 || val >= values[i - 1]);
        const isDecreasing = values.every((val, i) => i === 0 || val <= values[i - 1]);
        
        return (trendType === 'increasing' && isIncreasing) || 
               (trendType === 'decreasing' && isDecreasing);
    }

    // Get parameter value from system state
    getParameterValue(parameter, systemState, tibberData) {
        switch (parameter) {
            case 'battery_soc': return systemState.battery_soc;
            case 'pv_power': return systemState.pv_power;
            case 'grid_power': return systemState.grid_power;
            case 'load': return systemState.load;
            case 'grid_voltage': return systemState.grid_voltage;
            case 'battery_voltage': return systemState.battery_voltage;
            case 'currentPrice': return tibberData?.currentPrice?.total;
            case 'inverter_state': return systemState.inverter_state;
            default: return null;
        }
    }

    // Check if current time is within rule time conditions
    isWithinTimeConditions(timeConditions) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });

        // Check day of week
        if (!timeConditions.days.includes(currentDay)) {
            return false;
        }

        // Check hour range
        if (timeConditions.startHour <= timeConditions.endHour) {
            return currentHour >= timeConditions.startHour && currentHour < timeConditions.endHour;
        } else {
            // Spans midnight
            return currentHour >= timeConditions.startHour || currentHour < timeConditions.endHour;
        }
    }

    // Update rule statistics
    updateRuleStatistics(rule) {
        rule.statistics.triggeredCount++;
        rule.statistics.lastTriggered = new Date().toISOString();
        rule.updatedAt = new Date().toISOString();
        this.saveRules();
    }

    // Generate notification message from template
    generateMessage(rule, systemState, tibberData) {
        let message = rule.action.messageTemplate;
        
        // Replace variables
        const variables = {
            battery_soc: systemState.battery_soc || 0,
            pv_power: systemState.pv_power || 0,
            grid_power: systemState.grid_power || 0,
            load: systemState.load || 0,
            grid_voltage: systemState.grid_voltage || 0,
            currentPrice: tibberData?.currentPrice?.total || 0,
            timestamp: new Date().toLocaleString()
        };

        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            message = message.replace(regex, value);
        });

        return message;
    }

    // CRUD operations for rules
    createRule(ruleData) {
        const rule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: ruleData.name || 'New Rule',
            description: ruleData.description || '',
            enabled: ruleData.enabled !== false,
            priority: ruleData.priority || 'medium',
            conditions: ruleData.conditions || [],
            logic: ruleData.logic || 'AND',
            action: {
                channels: ruleData.action?.channels || ['ui'],
                severity: ruleData.action?.severity || 'info',
                messageTemplate: ruleData.action?.messageTemplate || 'Rule triggered: {name}',
                cooldown: ruleData.action?.cooldown || 300000
            },
            timeConditions: {
                enabled: ruleData.timeConditions?.enabled || false,
                startHour: ruleData.timeConditions?.startHour || 0,
                endHour: ruleData.timeConditions?.endHour || 24,
                days: ruleData.timeConditions?.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            statistics: {
                triggeredCount: 0,
                lastTriggered: null,
                lastValue: null
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.rules.set(rule.id, rule);
        this.saveRules();
        return rule;
    }

    getRules() {
        return Array.from(this.rules.values());
    }

    getRule(id) {
        return this.rules.get(id);
    }

    updateRule(id, updates) {
        const rule = this.rules.get(id);
        if (!rule) return null;

        const updatedRule = {
            ...rule,
            ...updates,
            id, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        this.rules.set(id, updatedRule);
        this.saveRules();
        return updatedRule;
    }

    deleteRule(id) {
        const success = this.rules.delete(id);
        if (success) {
            this.cooldowns.delete(id);
            this.saveRules();
        }
        return success;
    }

    toggleRule(id) {
        const rule = this.rules.get(id);
        if (!rule) return null;

        rule.enabled = !rule.enabled;
        rule.updatedAt = new Date().toISOString();
        this.saveRules();
        return rule;
    }

    // Test rule with current system state
    testRule(id, systemState, tibberData) {
        const rule = this.rules.get(id);
        if (!rule) return null;

        const wouldTrigger = this.evaluateConditions(rule, systemState, tibberData);
        const message = this.generateMessage(rule, systemState, tibberData);

        return {
            wouldTrigger,
            message,
            conditions: rule.conditions.map(condition => ({
                parameter: condition.parameter,
                operator: condition.operator,
                value: condition.value,
                currentValue: this.getParameterValue(condition.parameter, systemState, tibberData),
                result: this.evaluateCondition(condition, 
                    this.getParameterValue(condition.parameter, systemState, tibberData), 
                    systemState)
            }))
        };
    }

    // Import/Export functionality
    exportRules() {
        return {
            rules: Array.from(this.rules.values()),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    importRules(data) {
        try {
            if (!data.rules || !Array.isArray(data.rules)) {
                throw new Error('Invalid rules data format');
            }

            let imported = 0;
            data.rules.forEach(ruleData => {
                // Generate new ID to avoid conflicts
                const newId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const rule = {
                    ...ruleData,
                    id: newId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    statistics: {
                        triggeredCount: 0,
                        lastTriggered: null,
                        lastValue: null
                    }
                };

                this.rules.set(newId, rule);
                imported++;
            });

            this.saveRules();
            return { success: true, imported };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get rule templates
    getTemplates() {
        return [
            {
                name: 'Battery Low Alert',
                description: 'Alert when battery SOC is below threshold',
                template: {
                    conditions: [{
                        parameter: 'battery_soc',
                        operator: 'lt',
                        value: 20,
                        type: 'threshold'
                    }],
                    action: {
                        channels: ['telegram', 'ui'],
                        severity: 'warning',
                        messageTemplate: '🔋 Battery Low: {battery_soc}%\nPV: {pv_power}W | Load: {load}W',
                        cooldown: 1800000
                    }
                }
            },
            {
                name: 'Optimal Charging Price',
                description: 'Alert when electricity price is optimal for charging',
                template: {
                    conditions: [{
                        parameter: 'currentPrice',
                        operator: 'lt',
                        value: 8,
                        type: 'threshold'
                    }],
                    action: {
                        channels: ['ui'],
                        severity: 'info',
                        messageTemplate: '💰 Optimal Price: {currentPrice}¢/kWh\nGood time to charge!',
                        cooldown: 3600000
                    }
                }
            },
            {
                name: 'Grid Voltage Issue',
                description: 'Alert when grid voltage is outside safe range',
                template: {
                    conditions: [
                        {
                            parameter: 'grid_voltage',
                            operator: 'lt',
                            value: 200,
                            type: 'threshold'
                        },
                        {
                            parameter: 'grid_voltage',
                            operator: 'gt',
                            value: 250,
                            type: 'threshold'
                        }
                    ],
                    logic: 'OR',
                    action: {
                        channels: ['telegram', 'ui'],
                        severity: 'critical',
                        messageTemplate: '⚡ Grid Voltage Issue: {grid_voltage}V\nNormal range: 200-250V',
                        cooldown: 900000
                    }
                }
            }
        ];
    }
}

module.exports = new RuleEvaluationService();