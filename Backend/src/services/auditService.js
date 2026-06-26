const AuditEvent = require('../models/AuditEvent');

class AuditService {
    async logEvent({ eventType, entityName, entityId, oldValue, newValue, modifiedBy, reason, requestIp, userAgent }) {
        try {
            await AuditEvent.create({
                eventType,
                entityName,
                entityId,
                oldValue: oldValue ? JSON.stringify(oldValue) : null,
                newValue: newValue ? JSON.stringify(newValue) : null,
                modifiedBy,
                reason,
                requestIp,
                userAgent
            });
        } catch (error) {
            console.error("Failed to create audit log:", error);
        }
    }
}

module.exports = new AuditService();
