const mongoose = require("mongoose");

const connectDB = async () => {
    try{
        if (mongoose.connection.readyState == 1){
            console.log("MongoDB already connected");
            return;
        }
        await  mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    }catch(error){
        console.error("MongoBD connection failed: "+error.message);
        process.exit(1);
    }
    
};

module.exports = connectDB;

