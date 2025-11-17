const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        planType: { type: String, enum: ["5k", "10k", "15k"], required: true },
        reward: { type: Number, required: true },
        assignedDate: { type: Date, required: true },
        mediaUrl: { type: String, default: "" },
        mediaType: { type: String, enum: ["image", "video", "link", "none"], default: "none" },
        linkUrl: { type: String, default: "" },
        ctaLabel: { type: String, default: "Open" },
    },
    { timestamps: true }
);

module.exports = taskSchema;



