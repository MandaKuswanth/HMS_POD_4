require("dotenv").config();

const mongoose = require("mongoose");
const Node = require("../models/Node");
const Counter = require("../models/Counter");

const nodeData = [
    {
        nodeId: "NODE-000001",
        name: "Dashboard",
        path: "/dashboard",
        icon: "dashboard",
        permissions: ["DASHBOARD_READ"],
        parentNodeId: null,
        order: 1,
        status: true,
        isDeleted: false
    },
    {
        nodeId: "NODE-000002",
        name: "Employees",
        path: "/employees",
        icon: "groups",
        permissions: ["EMPLOYEE_READ"],
        parentNodeId: null,
        order: 2,
        status: true,
        isDeleted: false
    },
    {
        nodeId: "NODE-000003",
        name: "Patients",
        path: "/patients",
        icon: "personal_injury",
        permissions: ["PATIENT_READ"],
        parentNodeId: null,
        order: 3,
        status: true,
        isDeleted: false
    },
    {
        nodeId: "NODE-000004",
        name: "Appointments",
        path: "/appointments",
        icon: "event_available",
        permissions: ["APPOINTMENT_READ"],
        parentNodeId: null,
        order: 4,
        status: true,
        isDeleted: false
    },
    {
        nodeId: "NODE-000005",
        name: "Health Records",
        path: "/health-records",
        icon: "medical_information",
        permissions: ["HEALTH_RECORD_READ"],
        parentNodeId: null,
        order: 5,
        status: true,
        isDeleted: false
    },
    {
        nodeId: "NODE-000006",
        name: "Roles",
        path: "/roles",
        icon: "admin_panel_settings",
        permissions: ["ROLE_READ"],
        parentNodeId: null,
        order: 6,
        status: true,
        isDeleted: false
    },
    {
        nodeId: "NODE-000007",
        name: "Nodes",
        path: "/nodes",
        icon: "category",
        permissions: ["NODE_READ"],
        parentNodeId: null,
        order: 7,
        status: true,
        isDeleted: false
    }
];

const seedNodes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");

        await Node.deleteMany({});
        await Counter.deleteOne({ name: "node" });

        await Node.insertMany(nodeData);

        await Counter.findOneAndUpdate(
            { name: "node" },
            { seq: nodeData.length },
            { upsert: true, new: true }
        );

        console.log("Nodes seeded successfully");

        process.exit(0);
    } catch (err) {
        console.error("Node seed error:", err);
        process.exit(1);
    }
};

seedNodes();
 