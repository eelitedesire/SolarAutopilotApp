// Notification Routes for CARBONOZ SolarAutopilot
// Provides comprehensive notification management API

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const telegramService = require('../services/telegramService');
const ruleEvaluationService = require('../services/ruleEvaluationService');
const fs = require('fs');
const path = require('path');

// Get all notifications with filtering
router.get('/', (req, res) => {
    try {
        const filters = {
            severity: req.query.severity,
            type: req.query.type,
            source: req.query.source,
            since: req.query.since,
            limit: parseInt(req.query.limit) || 50
        };

        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined) {
                delete filters[key];
            }
        });

        const notifications = notificationService.getNotifications(filters);
        const grouped = notificationService.getGroupedNotifications();

        res.json({
            success: true,
            notifications: notifications.slice(0, filters.limit),
            grouped,
            total: notifications.length,
            filters
        });
    } catch (error) {
        console.error('Error fetching enhanced notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    }
});

// Get notification statistics
router.get('/stats', (req, res) => {
    try {
        const notifications = notificationService.getNotifications();
        
        const stats = {
            total: notifications.length,
            bySeverity: {
                critical: notifications.filter(n => n.severity === 'critical').length,
                warning: notifications.filter(n => n.severity === 'warning').length,
                info: notifications.filter(n => n.severity === 'info').length
            },
            byType: {},
            bySource: {},
            unacknowledged: notifications.filter(n => !n.acknowledged).length,
            last24Hours: notifications.filter(n => {
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return new Date(n.timestamp) >= dayAgo;
            }).length
        };

        // Count by type
        notifications.forEach(n => {
            stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
            stats.bySource[n.source] = (stats.bySource[n.source] || 0) + 1;
        });

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification statistics'
        });
    }
});

// Acknowledge a notification
router.post('/:id/acknowledge', (req, res) => {
    try {
        const { id } = req.params;
        const success = notificationService.acknowledgeNotification(id);
        
        if (success) {
            res.json({
                success: true,
                message: 'Notification acknowledged'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
    } catch (error) {
        console.error('Error acknowledging notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge notification'
        });
    }
});

// Clear notifications
router.post('/clear', (req, res) => {
    try {
        const filters = req.body.filters || {};
        const cleared = notificationService.clearNotifications(filters);
        
        res.json({
            success: true,
            message: `Cleared ${cleared} notifications`,
            cleared
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear notifications'
        });
    }
});

// Create a test notification
router.post('/test', async (req, res) => {
    try {
        const { type = 'system_alert', severity = 'info', title, message } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Title and message are required'
            });
        }

        const notification = notificationService.createNotification({
            type,
            severity,
            title,
            message,
            source: 'test_system',
            data: {
                testNotification: true,
                timestamp: new Date().toISOString()
            },
            channels: ['ui', 'telegram']
        });

        const success = await notificationService.processNotification(notification);
        
        res.json({
            success,
            message: success ? 'Test notification created' : 'Failed to create test notification',
            notification: success ? notification : null
        });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create test notification'
        });
    }
});

// Update notification settings
router.post('/settings', (req, res) => {
    try {
        const { thresholds, quietHours, rateLimit } = req.body;
        
        if (thresholds) {
            notificationService.updateThresholds(thresholds);
        }
        
        if (quietHours) {
            notificationService.updateQuietHours(quietHours.start, quietHours.end);
        }
        
        if (rateLimit) {
            notificationService.updateRateLimit(rateLimit.maxPerHour);
        }
        
        res.json({
            success: true,
            message: 'Notification settings updated'
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification settings'
        });
    }
});

// Get notification settings
router.get('/settings', (req, res) => {
    try {
        res.json({
            success: true,
            settings: {
                thresholds: notificationService.thresholds,
                quietHours: notificationService.quietHours,
                maxNotificationsPerHour: notificationService.maxNotificationsPerHour
            }
        });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification settings'
        });
    }
});

// Trigger system threshold check (for testing)
router.post('/check-thresholds', async (req, res) => {
    try {
        const systemState = global.currentSystemState || req.body.systemState;
        
        if (!systemState) {
            return res.status(400).json({
                success: false,
                error: 'System state is required'
            });
        }

        const notifications = await notificationService.checkSystemThresholds(systemState);
        
        res.json({
            success: true,
            message: `Generated ${notifications.length} threshold notifications`,
            notifications
        });
    } catch (error) {
        console.error('Error checking thresholds:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check thresholds'
        });
    }
});

// Trigger price alert check (for testing)
router.post('/check-prices', async (req, res) => {
    try {
        const priceData = req.body.priceData;
        
        if (!priceData) {
            return res.status(400).json({
                success: false,
                error: 'Price data is required'
            });
        }

        const notifications = await notificationService.checkPriceAlerts(priceData);
        
        res.json({
            success: true,
            message: `Generated ${notifications.length} price notifications`,
            notifications
        });
    } catch (error) {
        console.error('Error checking prices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check prices'
        });
    }
});

// Get notification delivery status
router.get('/:id/delivery', (req, res) => {
    try {
        const { id } = req.params;
        const notifications = notificationService.getNotifications();
        const notification = notifications.find(n => n.id === id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.json({
            success: true,
            delivery: {
                delivered: notification.delivered,
                channels: notification.channels,
                results: notification.deliveryResults || {},
                timestamp: notification.timestamp
            }
        });
    } catch (error) {
        console.error('Error fetching delivery status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch delivery status'
        });
    }
});

// Export notification data
router.get('/export', (req, res) => {
    try {
        const { format = 'json', since, severity, type } = req.query;
        
        const filters = {};
        if (since) filters.since = since;
        if (severity) filters.severity = severity;
        if (type) filters.type = type;
        
        const notifications = notificationService.getNotifications(filters);
        
        if (format === 'csv') {
            // Convert to CSV
            const csv = [
                'ID,Timestamp,Type,Severity,Source,Title,Message,Acknowledged',
                ...notifications.map(n => [
                    n.id,
                    n.timestamp,
                    n.type,
                    n.severity,
                    n.source,
                    `"${n.title.replace(/"/g, '""')}"`,
                    `"${n.message.replace(/"/g, '""')}"`,
                    n.acknowledged
                ].join(','))
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="notifications.csv"');
            res.send(csv);
        } else {
            // JSON format
            res.json({
                success: true,
                notifications,
                exportedAt: new Date().toISOString(),
                filters
            });
        }
    } catch (error) {
        console.error('Error exporting notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export notifications'
        });
    }
});

// Webhook endpoint for external systems
router.post('/webhook', async (req, res) => {
    try {
        const { source, type, severity, title, message, data } = req.body;
        
        if (!source || !type || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: source, type, title, message'
            });
        }

        const notification = notificationService.createNotification({
            type,
            severity: severity || 'info',
            title,
            message,
            source: `webhook_${source}`,
            data: data || {},
            channels: ['ui']
        });

        const success = await notificationService.processNotification(notification);
        
        res.json({
            success,
            message: success ? 'Webhook notification processed' : 'Failed to process webhook notification',
            notificationId: success ? notification.id : null
        });
    } catch (error) {
        console.error('Error processing webhook notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process webhook notification'
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    try {
        const notifications = notificationService.getNotifications();
        const recentNotifications = notifications.filter(n => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return new Date(n.timestamp) >= fiveMinutesAgo;
        });

        res.json({
            success: true,
            health: {
                status: 'healthy',
                totalNotifications: notifications.length,
                recentNotifications: recentNotifications.length,
                telegramEnabled: telegramService.getConfig().enabled,
                lastCheck: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error checking notification health:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});

// Telegram configuration endpoints
router.post('/telegram/test', async (req, res) => {
    try {
        const { token, chatId } = req.body;
        
        if (!token || !chatId) {
            return res.status(400).json({ success: false, error: 'Token and chat ID required' });
        }
        
        // Test Telegram connection
        const testMessage = '🔧 CARBONOZ SolarAutopilot - Test notification\n\nYour Telegram integration is working correctly!';
        
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: testMessage,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            res.json({ success: true, message: 'Test message sent successfully' });
        } else {
            res.status(400).json({ success: false, error: result.description || 'Failed to send test message' });
        }
    } catch (error) {
        console.error('Error testing Telegram:', error);
        res.status(500).json({ success: false, error: 'Connection test failed' });
    }
});

router.post('/telegram/config', (req, res) => {
    try {
        const { token, chatId } = req.body;
        
        if (!token || !chatId) {
            return res.status(400).json({ success: false, error: 'Token and chat ID required' });
        }
        
        telegramService.updateConfig({ token, chatId });
        res.json({ success: true, message: 'Telegram configuration saved' });
    } catch (error) {
        console.error('Error saving Telegram config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/telegram/config', (req, res) => {
    try {
        const config = telegramService.getConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting Telegram config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/telegram/settings', (req, res) => {
    try {
        const { enabled } = req.body;
        telegramService.updateSettings({ enabled });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Telegram settings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/telegram/types', (req, res) => {
    try {
        telegramService.updateNotificationTypes(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Telegram types:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/telegram/reset', (req, res) => {
    try {
        telegramService.resetConfig();
        res.json({ success: true });
    } catch (error) {
        console.error('Error resetting Telegram config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Conditional notification rules
router.get('/rules', (req, res) => {
    try {
        const rules = notificationService.getConditionRules();
        res.json({ success: true, rules });
    } catch (error) {
        console.error('Error getting rules:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/rules', (req, res) => {
    try {
        const rule = notificationService.addConditionRule(req.body);
        res.json({ success: true, rule });
    } catch (error) {
        console.error('Error adding rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/rules/:id/toggle', (req, res) => {
    try {
        const success = notificationService.toggleConditionRule(req.params.id);
        res.json({ success });
    } catch (error) {
        console.error('Error toggling rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/rules/:id', (req, res) => {
    try {
        const success = notificationService.deleteConditionRule(req.params.id);
        res.json({ success });
    } catch (error) {
        console.error('Error deleting rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear all existing notifications
router.post('/clear-all', (req, res) => {
    try {
        notificationService.clearAllNotifications();
        res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing all notifications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== NOTIFICATION RULES MANAGEMENT =====

// Get all notification rules
router.get('/rules', (req, res) => {
    try {
        const rules = ruleEvaluationService.getRules();
        res.json({ success: true, rules });
    } catch (error) {
        console.error('Error getting rules:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new notification rule
router.post('/rules', (req, res) => {
    try {
        const rule = ruleEvaluationService.createRule(req.body);
        res.json({ success: true, rule });
    } catch (error) {
        console.error('Error creating rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get specific rule
router.get('/rules/:id', (req, res) => {
    try {
        const rule = ruleEvaluationService.getRule(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }
        res.json({ success: true, rule });
    } catch (error) {
        console.error('Error getting rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update notification rule
router.put('/rules/:id', (req, res) => {
    try {
        const rule = ruleEvaluationService.updateRule(req.params.id, req.body);
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }
        res.json({ success: true, rule });
    } catch (error) {
        console.error('Error updating rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete notification rule
router.delete('/rules/:id', (req, res) => {
    try {
        const success = ruleEvaluationService.deleteRule(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }
        res.json({ success: true, message: 'Rule deleted successfully' });
    } catch (error) {
        console.error('Error deleting rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Toggle rule enabled/disabled
router.post('/rules/:id/toggle', (req, res) => {
    try {
        const rule = ruleEvaluationService.toggleRule(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }
        res.json({ success: true, rule, message: `Rule ${rule.enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Error toggling rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test notification rule
router.post('/rules/:id/test', (req, res) => {
    try {
        const systemState = global.currentSystemState || req.body.systemState || {};
        const tibberData = global.currentTibberData || req.body.tibberData || {};
        
        const testResult = ruleEvaluationService.testRule(req.params.id, systemState, tibberData);
        if (!testResult) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }

        // If rule would trigger, create a test notification
        if (testResult.wouldTrigger) {
            const rule = ruleEvaluationService.getRule(req.params.id);
            const testNotification = notificationService.createNotification({
                type: 'test_rule',
                severity: rule.action.severity,
                title: `[TEST] ${rule.name}`,
                message: testResult.message,
                source: 'rule_test',
                data: { ruleId: req.params.id, testMode: true },
                channels: ['ui']
            });
            
            notificationService.processNotification(testNotification);
        }

        res.json({ success: true, testResult });
    } catch (error) {
        console.error('Error testing rule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get rule statistics
router.get('/rules/:id/stats', (req, res) => {
    try {
        const rule = ruleEvaluationService.getRule(req.params.id);
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Rule not found' });
        }
        res.json({ success: true, statistics: rule.statistics });
    } catch (error) {
        console.error('Error getting rule stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Import notification rules
router.post('/rules/import', (req, res) => {
    try {
        const result = ruleEvaluationService.importRules(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error importing rules:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Export notification rules
router.get('/rules/export', (req, res) => {
    try {
        const data = ruleEvaluationService.exportRules();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error exporting rules:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get rule templates
router.get('/templates', (req, res) => {
    try {
        const templatesPath = path.join(__dirname, '../data/notification-templates.json');
        if (fs.existsSync(templatesPath)) {
            const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
            res.json({ success: true, templates: templates.templates, categories: templates.categories });
        } else {
            res.json({ success: true, templates: [], categories: [] });
        }
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create rule from template
router.post('/rules/from-template/:templateId', (req, res) => {
    try {
        const templatesPath = path.join(__dirname, '../data/notification-templates.json');
        if (!fs.existsSync(templatesPath)) {
            return res.status(404).json({ success: false, error: 'Templates not found' });
        }

        const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        const template = templates.templates.find(t => t.id === req.params.templateId);
        
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        const ruleData = {
            ...template.template,
            ...req.body // Allow overrides
        };

        const rule = ruleEvaluationService.createRule(ruleData);
        res.json({ success: true, rule });
    } catch (error) {
        console.error('Error creating rule from template:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Evaluate all rules (for testing)
router.post('/rules/evaluate', (req, res) => {
    try {
        const systemState = global.currentSystemState || req.body.systemState || {};
        const tibberData = global.currentTibberData || req.body.tibberData || {};
        
        const triggeredRules = ruleEvaluationService.evaluateRules(systemState, tibberData);
        
        res.json({ 
            success: true, 
            triggeredRules: triggeredRules.length,
            rules: triggeredRules.map(rule => ({
                id: rule.id,
                name: rule.name,
                severity: rule.action.severity,
                message: ruleEvaluationService.generateMessage(rule, systemState, tibberData)
            }))
        });
    } catch (error) {
        console.error('Error evaluating rules:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;