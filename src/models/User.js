const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true

    },
    passwordHash:{
        type:String,
        required:true,

    },
    status:{
        type:Boolean,
        default:true
    },
    roles:{
        type:String,
        enum:["ADMIN","OWNER","DOCTOR","RECEPTIONIST","CASHIER","NURSE","LAB_TECH","PHARMACIST"],
        required:true
    },
    employeeId:{
        type:String,
        required:true
    },
    lastLogin:{
        type:Date,
        default:null
    }

},
{
timestamps:{
    createdAt:"created_at",
    updatedAt:"updated_at"
}
}
);
module.exports=mongoose.model("user",userSchema);