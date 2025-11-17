const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        username: { type: String, unique: true, required: true },
        email: { type: String, unique: true, required: true },
        phone: { type: String, required: false, default: "" },
        bankName: { type: String, required: false, default: "" },
        accountNumber: { type: String, required: false, default: "" },
        password: { type: String, required: true },
        planType: { type: String, enum: ["5k", "10k", "15k"], required: true },
        taskBalance: { type: Number, default: 0 },
        referralBalance: { type: Number, default: 0 },
        referralCode: { type: String, unique: true },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        usedCouponCode: { type: String },
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = userSchema;
