const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        bankName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    },
    { timestamps: true }
);

module.exports = withdrawalSchema;



