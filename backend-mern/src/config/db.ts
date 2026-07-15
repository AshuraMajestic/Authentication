import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGO_URI);

  const { connection } = mongoose;
  connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
  connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  console.log(`MongoDB connected → ${connection.name}`);
}
