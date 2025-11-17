const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Coupon = require("../model/couponModel");
const Task = require("../model/taskModel");
const User = require("../model/userModel");
const Withdrawal = require("../model/withdrawalModel");
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const router = express.Router();

function requireAdmin(req, res, next) {
    try {
        // Try to get token from cookies first, then from Authorization header
        let token = req.cookies?.token;
        
        // If no cookie token, try Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            } else {
                token = authHeader;
            }
        }
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!payload.isAdmin) {
            return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
        
        req.user = payload;
        next();
    } catch (e) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
        }
        console.error('Admin auth error:', e);
        return res.status(401).json({ message: "Unauthorized" });
    }
}

router.get("/overview", requireAdmin, async (req, res) => {
    const [totalUsers, couponsTotal, couponsUsed, couponsUnused, pendingWithdrawals, totalTasks] = await Promise.all([
        User.countDocuments(),
        Coupon.countDocuments(),
        Coupon.countDocuments({ status: "used" }),
        Coupon.countDocuments({ status: "unused" }),
        Withdrawal.countDocuments({ status: "Pending" }),
        Task.countDocuments(),
    ]);
    res.json({ totalUsers, coupons: { total: couponsTotal, used: couponsUsed, unused: couponsUnused }, pendingWithdrawals, totalTasks });
});

// Users list
router.get("/users", requireAdmin, async (req, res) => {
    const list = await User.find().select("name username email planType taskBalance referralBalance createdAt").sort({ createdAt: -1 });
    res.json(list);
});

// Coupons CRUD
router.post("/coupons", requireAdmin, async (req, res) => {
    const { code, planType, amount } = req.body;
    if (!code || !planType || !amount) return res.status(400).json({ message: "Missing fields" });
    const coupon = await Coupon.create({ code, planType, amount });
    res.status(201).json(coupon);
});

// Bulk-generate coupons
router.post("/coupons/bulk", requireAdmin, async (req, res) => {
    try {
        const { planType, amount, quantity = 1, prefix = "CPN" } = req.body;
        if (!planType || !amount || !quantity) return res.status(400).json({ message: "Missing fields" });
        const qty = Math.min(Number(quantity), 1000);
        const codes = new Set();
        function generateCode() {
            const random = crypto.randomBytes(4).toString("hex").toUpperCase();
            return `${prefix}-${random}`;
        }
        while (codes.size < qty) {
            codes.add(generateCode());
        }
        const docs = Array.from(codes).map(code => ({ code, planType, amount }));
        const created = await Coupon.insertMany(docs, { ordered: false });
        res.status(201).json({ count: created.length, items: created });
    } catch (e) {
        res.status(500).json({ message: "Failed to generate coupons" });
    }
});

router.get("/coupons", requireAdmin, async (req, res) => {
    const list = await Coupon.find().sort({ createdAt: -1 });
    res.json(list);
});

router.patch("/coupons/:id", requireAdmin, async (req, res) => {
    const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

router.delete("/coupons/:id", requireAdmin, async (req, res) => {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// Tasks
router.post("/tasks", requireAdmin, async (req, res) => {
    const { title, description, planType, reward, assignedDate, mediaUrl = "", mediaType = "none", linkUrl = "", ctaLabel = "Open" } = req.body;
    if (!title || !description || !planType || !reward || !assignedDate) {
        return res.status(400).json({ message: "Missing fields" });
    }
    
    // Normalize assignedDate to midnight (00:00:00) in local timezone
    const date = new Date(assignedDate);
    date.setHours(0, 0, 0, 0);
    
    if (planType === 'all') {
        // Create for all plans with scaled rewards: 5k = base, 10k = x2, 15k = x5
        const docs = [
            { title, description, planType: '5k',  reward: Number(reward),            assignedDate: date, mediaUrl, mediaType, linkUrl, ctaLabel },
            { title, description, planType: '10k', reward: Number(reward) * 2,       assignedDate: date, mediaUrl, mediaType, linkUrl, ctaLabel },
            { title, description, planType: '15k', reward: Number(reward) * 5,       assignedDate: date, mediaUrl, mediaType, linkUrl, ctaLabel },
        ];
        const created = await Task.insertMany(docs);
        return res.status(201).json({ count: created.length, items: created });
    }
    const task = await Task.create({ title, description, planType, reward, assignedDate: date, mediaUrl, mediaType, linkUrl, ctaLabel });
    res.status(201).json(task);
});

router.get("/tasks", requireAdmin, async (req, res) => {
    const list = await Task.find().sort({ assignedDate: -1 });
    res.json(list);
});

// Upload media to Cloudinary
router.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const buffer = req.file.buffer;
        const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ resource_type: type }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
            stream.end(buffer);
        });
        const result = await uploadPromise;
        res.json({ url: result.secure_url, type });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// Withdrawals
router.get("/withdrawals", requireAdmin, async (req, res) => {
    const list = await Withdrawal.find().sort({ createdAt: -1 }).populate("userId", "name username planType");
    res.json(list);
});

router.post("/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    const wd = await Withdrawal.findByIdAndUpdate(req.params.id, { status: "Approved" }, { new: true });
    res.json(wd);
});

router.post("/withdrawals/:id/reject", requireAdmin, async (req, res) => {
    const wd = await Withdrawal.findByIdAndUpdate(req.params.id, { status: "Rejected" }, { new: true });
    res.json(wd);
});

module.exports = router;


