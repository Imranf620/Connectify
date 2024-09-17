import mongoose from "mongoose";

const connectDb = async () => {
  const mongoUrl = process.env.MONGODB_URL as string;

  if (!mongoUrl) {
    throw new Error("MONGODB_URL is not defined in the environment variables.");
  }

  try {
    const connection = await mongoose.connect(mongoUrl);
    console.log(`Connected to MongoDB at ${connection.connection.host}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error connecting to DB: ${err.message}`);
    } else {
      console.error(`Unknown error occurred: ${err}`);
    }
  }
};

export default connectDb;
