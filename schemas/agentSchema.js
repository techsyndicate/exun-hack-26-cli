import mongoose from "mongoose"

const schema = new mongoose.Schema({
    name: {type: String, required: true},
    admin: {type: Boolean, required: true},
    currentTask: {type: String, default: "none"},
    password: {type: String, required: true}
}, { timestamps: true });

export const Agent = mongoose.model("Agent", schema);
