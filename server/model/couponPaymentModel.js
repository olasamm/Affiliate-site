const mongoose = require("mongoose");

const couponPaymentSchema = new mongoose.Schema(
    {
        reference: { type: String, unique: true, required: true },
        email: { type: String, required: true },
        planType: { type: String, enum: ["5k", "10k", "15k"], required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["initialized", "success", "failed"], default: "initialized" },
        couponCode: { type: String, default: "" },
    },
    { timestamps: true }
);

const CouponPayment = mongoose.model("CouponPayment", couponPaymentSchema);

module.exports = CouponPayment;
