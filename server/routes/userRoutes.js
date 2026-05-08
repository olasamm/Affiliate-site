const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const User = require("../model/userModel");
const Task = require("../model/taskModel");
const Withdrawal = require("../model/withdrawalModel");
const WithdrawalSetting = require("../model/withdrawalSettingModel");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getExtFromMime(mimeType) {
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    return ".jpg";
}

async function uploadProofImage(file) {
    const hasCloudinaryConfig =
        !!process.env.CLOUDINARY_CLOUD_NAME &&
        !!process.env.CLOUDINARY_API_KEY &&
        !!process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinaryConfig) {
        const cloudinaryResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ resource_type: "image", folder: "task-proofs" }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
            stream.end(file.buffer);
        });
        return cloudinaryResult.secure_url;
    }

    const uploadsRoot = path.join(__dirname, "..", "uploads", "task-proofs");
    fs.mkdirSync(uploadsRoot, { recursive: true });
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${getExtFromMime(file.mimetype)}`;
    const fullPath = path.join(uploadsRoot, fileName);
    fs.writeFileSync(fullPath, file.buffer);
    return `/uploads/task-proofs/${fileName}`;
}

function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}

// Profile
router.get("/profile", requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

router.patch("/profile", requireAuth, async (req, res) => {
    const allowed = ["name", "phone", "bankName", "accountNumber"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    res.json(user);
});

// Tasks
router.get("/tasks", requireAuth, async (req, res) => {
    const me = await User.findById(req.user.id);
    
    // Get today's date at midnight (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date at midnight (00:00:00) - this is the upper bound
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find tasks for user's plan type assigned for today
    // Now that we normalize dates on creation, simple date comparison should work
    const list = await Task.find({
        planType: me.planType,
        assignedDate: {
            $gte: today,
            $lt: tomorrow
        }
    }).sort({ createdAt: -1 });

    const completedSet = new Set((me.completedTasks || []).map((id) => id.toString()));
    const tasksWithStatus = list.map((task) => {
        const item = task.toObject();
        item.completed = completedSet.has(task._id.toString());
        return item;
    });
    
    console.log(`Found ${list.length} tasks for user ${me.username} (plan: ${me.planType}) for date ${today.toISOString().split('T')[0]}`);
    
    res.json(tasksWithStatus);
});

router.post("/tasks/:id/complete", requireAuth, upload.single("proofImage"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Please upload a proof image before completing task" });
    }
    if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Proof must be an image file" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (task.planType !== user.planType) return res.status(403).json({ message: "Task not assigned to your plan" });

    const isCompleted = (user.completedTasks || []).some((taskId) => taskId.toString() === task._id.toString());
    if (isCompleted) {
        return res.status(400).json({ message: "Task already completed" });
    }

    const proofUrl = await uploadProofImage(req.file);

    const updateResult = await User.findOneAndUpdate(
        { _id: user._id, completedTasks: { $ne: task._id } },
        {
            $inc: { taskBalance: task.reward },
            $addToSet: { completedTasks: task._id },
            $push: {
                taskSubmissions: {
                    taskId: task._id,
                    proof: proofUrl,
                    submittedAt: new Date(),
                },
            },
        },
        { new: true }
    );

    if (!updateResult) {
        return res.status(400).json({ message: "Task already completed" });
    }

    res.json({ message: "Task completed", taskReward: task.reward, taskBalance: updateResult.taskBalance });
});

// Withdrawals
router.post("/withdrawals", requireAuth, async (req, res) => {
    const { amount, source, bankName, accountNumber } = req.body;
    if (!amount || !source || !bankName || !accountNumber) return res.status(400).json({ message: "Missing fields" });
    if (!["task", "referral"].includes(source)) return res.status(400).json({ message: "Invalid withdrawal source" });

    const setting = await WithdrawalSetting.findOne({ key: "global" });
    if (setting) {
        if (!setting.enabled) {
            return res.status(403).json({ message: "Withdrawals are not available at this time. Please try again later." });
        }
        const now = new Date();
        if (setting.endAt && now > setting.endAt) {
            setting.enabled = false;
            setting.endAt = null;
            await setting.save();
            return res.status(403).json({ message: "Withdrawals are not available at this time. Please try again later." });
        }
    }

    const user = await User.findById(req.user.id);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const selectedBalance = source === "task" ? user.taskBalance : user.referralBalance;
    if (numericAmount > selectedBalance) return res.status(400).json({ message: "Insufficient selected balance" });

    // Deduct immediately at request time.
    if (source === "task") {
        user.taskBalance -= numericAmount;
    } else {
        user.referralBalance -= numericAmount;
    }
    await user.save();

    const wd = await Withdrawal.create({ userId: user._id, amount: numericAmount, source, bankName, accountNumber });
    res.status(201).json(wd);
});

router.get("/withdrawals", requireAuth, async (req, res) => {
    const list = await Withdrawal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
});

// Referral info
router.get("/referrals", requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id).select("referralCode referralBalance");
    const origin = req.headers.origin || req.protocol + "://" + req.get("host");
    const referralLink = `${origin}/signup?invite=${encodeURIComponent(user.referralCode)}`;
    res.json({ referralCode: user.referralCode, referralBalance: user.referralBalance, referralLink });
});

module.exports = router;



