const mongoose= require('mongoose');
const  customerSchema = new mongoose.Schema({
    UHID:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    name:{
        type:String,
        required:true,
        trim:true,

    },
    phone:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    gender:{
        type:String,
        required:true,
        enum:["male","female","other"]
    },
    dob:{
        type:Date,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    emergencyContact:{
        name:String,
        relation:String,
        phone:String

    },
    status:{
        type:Boolean,
        default:true
    }

},
{
    timestamps:{
        createdAt:"created_At",
        updatedAt:"updated_At"
    }
}
)


customerSchema.pre('save',async function(next){
    if(this.isNew){
        try{
            const counter=await Counter.findOneAndUpdate(               
                    {name:'customer'},
                    {$inc:{seq:1}},
                    {new:true,upsert:true}               
            );
            this.UHID=`UHID-${String(counter.seq).padStart(6,'0')}`
        }catch(error){
            return next(error);

        }
    }
})

module.exports=mongoose.model("Customer",customerSchema);