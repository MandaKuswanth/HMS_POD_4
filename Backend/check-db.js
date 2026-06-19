const { MongoClient } = require("mongodb");

async function check() {
    const mongoUri = "mongodb://127.0.0.1:27017/test";
    console.log("Connecting to:", mongoUri);
    const client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db();
    const appts = await db.collection("appointments").find().toArray();
    console.log(`Found ${appts.length} appointments:`);
    
    // Let's run the exact same lookup aggregation
    const agg = await db.collection("appointments").aggregate([
        {
            $lookup: {
                from: "patients",
                localField: "patientId",
                foreignField: "UHID",
                as: "patientInfo"
            }
        },
        {
            $lookup: {
                from: "employees",
                localField: "doctorEmployeeId",
                foreignField: "employeeCode",
                as: "doctorInfo"
            }
        },
        {
            $addFields: {
                patientName: { $arrayElemAt: ["$patientInfo.name", 0] },
                doctorName: { $arrayElemAt: ["$doctorInfo.name", 0] }
            }
        },
        {
            $project: {
                patientInfo: 0,
                doctorInfo: 0
            }
        }
    ]).toArray();

    console.log("Aggregation lookup results:");
    console.log(JSON.stringify(agg, null, 2));

    await client.close();
}

check().catch(console.error);
