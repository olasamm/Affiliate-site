const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
    {
        referrerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rewardAmount: { type: Number, required: true },
    },
    { timestamps: true }
);

module.exports = referralSchema;



