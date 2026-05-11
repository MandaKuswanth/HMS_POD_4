const mongoose= require('mongoose');
const countSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    seq:{
        type:Number,
        default:0
    }
});

module.exports=mongoose.model("Counter",countSchema);