const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: { type: String, unique: true, required: true },
        planType: { type: String, enum: ["5k", "10k", "15k"], required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["unused", "used"], default: "unused" },
        assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

module.exports = couponSchema;



