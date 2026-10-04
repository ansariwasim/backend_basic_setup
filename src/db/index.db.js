import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI

const connectDB = async () => {
  try {
     await mongoose.connect(MONGODB_URI);

    console.log("MonogoDB connection successfully" );

  } catch (error) {

    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;