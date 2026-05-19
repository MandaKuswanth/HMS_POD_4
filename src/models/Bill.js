const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
    billId: { type: String, unique: true},
    patientId: {
        type: String, required: true
    },
    appointmentId: {
        type: String, required: true
    },
    items: {
        serviceName: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            min: 0,
            required: true
        }
    },
    total: { type: Number, required: true, min: 0},
    status: {
        type: String,
        enum: ["PENDING", "PAID", "PARTIAL"]
    },
    createdByEmployeeId: {
        type: String, trim: true
    }
},{
    timestamps: true
});
billSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const counter = await Counter.findOneAndUpdate(
        { name: "bill" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
 
      this.billId = `BILL-${String(counter.seq).padStart(6, "0")}`;
    }
 
   
  } catch (error) {
    next(error);
  }
});
 
module.exports = mongoose.model("Bill", billSchema);