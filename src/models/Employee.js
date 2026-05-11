const mongoose= require('mongoose');
const employeeSchema = new mongoose.Schema({
   employeeCode :{
    type:String,
    unique:true,
    required:true,
    trim:true
   },
   name:{
    type:String,
    required:true,
    trim:true
   },
   phone:{
    type:String,
    unique:true,
    required:true
   },
   email:{
    type:String,
    unique:true,
    required:true,
    trim:true
   },
   department:{
    type:String,
    required:true
   },
   designation:{
    type:String,
    required:true
   },
   status:{
    type:Boolean
   },
   joiningDate:{
    type:Date,
    required:true
   },
   medicalRegistrationNo:{
    type:String,
    unique:true,
    required:true
   },
   specialisation:{
    type:String,
    required:true
   },
   qualification:{
    type:Array,
    required:true
   },
   consultationFee:{
    type:Number,
    required:true
   },
   availablitySlots:{
    type:Array,
    required:true
   }


});

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
 
module.exports=mongoose.model("Employee",employeeSchema);