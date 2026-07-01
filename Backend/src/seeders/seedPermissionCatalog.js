const mongoose = require('mongoose');
require('dotenv').config();
const PermissionCatalog = require('../models/PermissionCatalog');

const seedData = [
    // Dashboard
    { key: 'DASHBOARD_READ', label: 'Dashboard Read', category: 'Dashboard' },

    // Employee Permissions
    { key: 'EMPLOYEE_CREATE', label: 'Employee Create', category: 'Employee Permissions' },
    { key: 'EMPLOYEE_READ', label: 'Employee Read', category: 'Employee Permissions' },
    { key: 'EMPLOYEE_UPDATE', label: 'Employee Update', category: 'Employee Permissions' },
    { key: 'EMPLOYEE_DELETE', label: 'Employee Delete', category: 'Employee Permissions' },

    // Role Permissions
    { key: 'ROLE_CREATE', label: 'Role Create', category: 'Role Permissions' },
    { key: 'ROLE_READ', label: 'Role Read', category: 'Role Permissions' },
    { key: 'ROLE_UPDATE', label: 'Role Update', category: 'Role Permissions' },
    { key: 'ROLE_DELETE', label: 'Role Delete', category: 'Role Permissions' },

    // Menu Node Permissions
    { key: 'NODE_CREATE', label: 'Menu Node Create', category: 'Menu Node Permissions' },
    { key: 'NODE_READ', label: 'Menu Node Read', category: 'Menu Node Permissions' },
    { key: 'NODE_UPDATE', label: 'Menu Node Update', category: 'Menu Node Permissions' },
    { key: 'NODE_DELETE', label: 'Menu Node Delete', category: 'Menu Node Permissions' },

    // Patient Permissions
    { key: 'PATIENT_CREATE', label: 'Patient Create', category: 'Patient Permissions' },
    { key: 'PATIENT_READ', label: 'Patient Read', category: 'Patient Permissions' },
    { key: 'PATIENT_UPDATE', label: 'Patient Update', category: 'Patient Permissions' },
    { key: 'PATIENT_DELETE', label: 'Patient Delete', category: 'Patient Permissions' },

    // Appointment Permissions
    { key: 'APPOINTMENT_CREATE', label: 'Appointment Create', category: 'Appointment Permissions' },
    { key: 'APPOINTMENT_READ', label: 'Appointment Read', category: 'Appointment Permissions' },
    { key: 'APPOINTMENT_UPDATE', label: 'Appointment Update', category: 'Appointment Permissions' },
    { key: 'APPOINTMENT_DELETE', label: 'Appointment Delete', category: 'Appointment Permissions' },
    { key: 'APPOINTMENT_CANCEL', label: 'Appointment Cancel', category: 'Appointment Permissions' },

    // Health Record Permissions
    { key: 'HEALTH_RECORD_CREATE', label: 'Health Record Create', category: 'Health Record Permissions' },
    { key: 'HEALTH_RECORD_READ', label: 'Health Record Read', category: 'Health Record Permissions' },
    { key: 'HEALTH_RECORD_UPDATE', label: 'Health Record Update', category: 'Health Record Permissions' },
    { key: 'HEALTH_RECORD_DELETE', label: 'Health Record Delete', category: 'Health Record Permissions' },
];

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        let created = 0;
        let updated = 0;

        for (const perm of seedData) {
            const result = await PermissionCatalog.updateOne(
                { key: perm.key },
                { $set: perm },
                { upsert: true }
            );
            if (result.upsertedCount > 0) created++;
            else updated++;
        }

        console.log(`Seed complete: ${created} created, ${updated} already existed/updated`);
        console.log(`Total permissions in catalog: ${seedData.length}`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

run();