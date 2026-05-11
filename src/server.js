const dotenv = require("dotenv");
dotenv.config();
const app = require('./app');
const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;
connectDB();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// =========================================================================
// const insertData = async () => {
//   try {
//     await Employee.create({
//       name: "Aishwarya",
//       phone: "9876543210",
//       email: "test@mail.com",
//       department: "Cardiology",
//       designation: "Doctor",
//       status: "Active",
//       joiningDate: new Date(),
//       medicalRegistrationNumber: "MRN123",
//       specialization: "Heart Specialist",
//       qualification: "MBBS",
//       consultationFee: 500,
//       availabilitySlots: [
//         {
//           day: "Monday",
//           startTime: "09:00",
//           endTime: "12:00"
//         }
//       ]
//     });

//     console.log("✅ Employee inserted");
//   } catch (error) {
//     console.error(error);
//   }
// };


// insertData();