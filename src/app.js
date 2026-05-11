const express = require("express");
const app = express();
const userRoutes=require('./Routes/userRoutes');
app.use(express.json());
app.use('/employee',userRoutes);
module.exports = app;