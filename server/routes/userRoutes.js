const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const Task = require("../model/taskModel");
const Withdrawal = require("../model/withdrawalModel");

const router = express.Router();

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
    
    console.log(`Found ${list.length} tasks for user ${me.username} (plan: ${me.planType}) for date ${today.toISOString().split('T')[0]}`);
    
    res.json(list);
});

router.post("/tasks/:id/complete", requireAuth, async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const user = await User.findById(req.user.id);
    user.taskBalance += task.reward;
    await user.save();
    res.json({ message: "Task completed", taskReward: task.reward, taskBalance: user.taskBalance });
});

// Withdrawals
router.post("/withdrawals", requireAuth, async (req, res) => {
    const { amount, bankName, accountNumber } = req.body;
    if (!amount || !bankName || !accountNumber) return res.status(400).json({ message: "Missing fields" });
    const user = await User.findById(req.user.id);
    const totalBalance = user.taskBalance + user.referralBalance;
    if (amount > totalBalance) return res.status(400).json({ message: "Insufficient balance" });
    const wd = await Withdrawal.create({ userId: user._id, amount, bankName, accountNumber });
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



