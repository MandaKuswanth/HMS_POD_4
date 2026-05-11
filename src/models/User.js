// id
// username/email (unique)
// passwordHash
// status → ACTIVE | Inactive
// roles[] → OWNER | ADMIN | DOCTOR | RECEPTIONIST | CASHIER | NURSE | LAB_TECH | PHARMACIST
// employeeId → reference to Employee (required for all internal roles)
// createdAt, lastLoginAt
 
const mongooge=require('mongoose')
const userSchema=new mongooge.Schema(
    {
     userName:{type:String,require:true,trim:true},
     passwordHash:{type:String,require:true},
     status:{type:Boolean,default:true},
     roles:{type:String, enum: [ "OWNER","ADMIN","DOCTOR","RECEPTIONIST","CASHIER","NURSE", "LAB_TECH", "PHARMACIST",],required:true},
     //The Employee id here stores the objectId from that table
     employeeId:{type:String,req:true},
     lastLoginAt: {type: Date,default: null},
    },
    
   {
    timestamps: true, //auto adds createdAt & updatedAt
   }
)

module.exports=mongooge.model("User",userSchema);