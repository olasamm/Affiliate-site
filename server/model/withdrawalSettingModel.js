const mongoose = require("mongoose");

const withdrawalSettingSchema = new mongoose.Schema(
    {
        key: { type: String, unique: true, default: "global" },
        enabled: { type: Boolean, default: true },
        autoCloseMinutes: { type: Number, default: 60, min: 1 },
        endAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const WithdrawalSetting = mongoose.model("WithdrawalSetting", withdrawalSettingSchema);

module.exports = WithdrawalSetting;
