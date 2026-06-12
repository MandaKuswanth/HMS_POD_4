const mongoose = require("mongoose")
const nodeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    roles: { type: String, required: true, trim: true }
})

module.exports = mongoose.model("Node", nodeSchema)