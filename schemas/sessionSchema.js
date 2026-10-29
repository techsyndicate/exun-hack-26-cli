import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    agentId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", schema);
