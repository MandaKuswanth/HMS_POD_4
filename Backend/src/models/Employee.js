const mongoose = require("mongoose");
const Counter = require("./Counter");



const employeeSchema = new mongoose.Schema({

    employeeCode: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    status: { type: Boolean, default: true },
    joiningDate:{type:Date},
    medicalRegistrationNo: { type: String },
    specialization: { type: String},
    qualification: { type: Array, default: [] },
    consultationFee: { type: Number },
    availabilitySlots: { type: Array }
},

    {
        timestamps: true
        
        
    }
)

employeeSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'employee' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.employeeCode = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }

});


module.exports = mongoose.model("Employee", employeeSchema)