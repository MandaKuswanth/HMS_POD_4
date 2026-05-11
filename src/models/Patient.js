// id
// UHID (unique hospital id)
// name
// phone, 
// email
// gender, 
// dob
// address
// emergencyContact (optional)
// status → ACTIVE | INACTIVE
const mongoose=require('mongoose');
const patientSchema=new mongoose.Schema({
  patientUhid:{type:String,require:true},
  name:{type:String,required:true,trim:true},
  phone:{type:String,required:true,trim:true},
  email:{type:String,required:true,trim:true},
  gender:{type:String,enum:["MALE","FEMALE"],required:true},
  dob:{type:Date,required:true},
  address:{house: {type: String,required: true},
           street: {type: String},city: {type: String,required: true},
           state: {type: String,required: true},
           pincode: {type: String,required: true},
           country: {type: String,default: "India"},
           },
  emergencyContact:{type:String,required:true,trim:true},
   status:{type:String,enum:["ACTIVE","INACTIVE"],required:true},
})
patientSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'employee' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.patientUhid = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports=mongooge.model("Patient",patientSchema);