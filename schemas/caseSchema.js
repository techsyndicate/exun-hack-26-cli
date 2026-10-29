import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
    assignedTo: { type: Array, default: [] },
    report: { type: String, default: "none" },
  },
  { timestamps: true }
);

export const Case = mongoose.model("Case", schema);
