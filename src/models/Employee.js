const mongoose =require('mongoose')
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model("Counter", counterSchema);
const employeeSchema =new mongoose.Schema({
   employeeCode:{type:String,trim:true},
   name:{type :String ,required:true ,trim :true},
   phone:{type:String,required:true,trim:true},
   email:{type:String,required:true,trim:true,unique:true,lowercase:true},
   department:{type:String,required:true,trim:true},
   designation:{type:String,required:true,trim:true},
   status:{type:String,enum:["Active","InActive"],required:true},
   joiningDate:{type:Date,required:true},
   medicalRegistrationNumber:{type:String,required:true,trim:true,unique:true},
   specialization:{type:String,required:true,trim:true},
   qualification:{type:String,required:true,trim:true},
   consultationFee:{type:Number,required:true,min:0},
   //availabilitySlots:{type:Array,required:true,default:[]}
   availabilitySlots: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        required: true,
      },
      startTime: {
        type: String, 
        required: true,
      },
      endTime: {
        type: String, 
        required: true,
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
    }]

});

employeeSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Employee' },
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
 