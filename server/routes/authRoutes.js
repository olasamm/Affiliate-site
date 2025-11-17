const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const Coupon = require("../model/couponModel");

const router = express.Router();

function signToken(user) {
    return jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}

router.post("/register", async (req, res) => {
    try {
        const {
            name,
            username,
            email,
            phone,
            bankName,
            accountNumber,
            password,
            planType,
            couponCode,
            invitationCode,
            adminSecret,
        } = req.body;
        
        console.log("Registration attempt:", { name, username, email, phone, bankName, accountNumber, planType, couponCode: couponCode ? 'provided' : 'missing', invitationCode: invitationCode || 'none' });

        const ADMIN_SECRET = process.env.ADMIN_SECRET || 'SAMUEL2025';
        const isAdminRegistration = !!adminSecret && adminSecret === ADMIN_SECRET;

        // Guard: ensure JWT secret is present before any DB writes
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "Server misconfiguration: JWT secret missing" });
        }

        // Helper function to check if a value is empty
        const isEmpty = (value) => !value || (typeof value === 'string' && value.trim() === '');
        
        if (!isAdminRegistration) {
            const missingFields = [];
            if (isEmpty(name)) missingFields.push('name');
            if (isEmpty(username)) missingFields.push('username');
            if (isEmpty(email)) missingFields.push('email');
            if (isEmpty(phone)) missingFields.push('phone');
            if (isEmpty(bankName)) missingFields.push('bankName');
            if (isEmpty(accountNumber)) missingFields.push('accountNumber');
            if (isEmpty(password)) missingFields.push('password');
            if (isEmpty(planType)) missingFields.push('planType');
            if (isEmpty(couponCode)) missingFields.push('couponCode');
            
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    message: `Missing required fields: ${missingFields.join(', ')}` 
                });
            }
        } else {
            const missingFields = [];
            if (isEmpty(name)) missingFields.push('name');
            if (isEmpty(username)) missingFields.push('username');
            if (isEmpty(email)) missingFields.push('email');
            if (isEmpty(password)) missingFields.push('password');
            
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    message: `Missing required admin fields: ${missingFields.join(', ')}` 
                });
            }
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.status(400).json({ message: "Email or username already exists" });

        let coupon = null;
        if (!isAdminRegistration) {
            coupon = await Coupon.findOne({ code: couponCode, status: "unused" });
            if (!coupon) return res.status(400).json({ message: "Invalid or used coupon" });
            if (coupon.planType !== planType) return res.status(400).json({ message: "Coupon does not match selected plan" });
        }

        const hashed = await bcrypt.hash(password, 10);

        // Generate referral code
        const referralCode = `${username}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

        let invitedByUser = null;
        if (invitationCode) {
            invitedByUser = await User.findOne({ referralCode: invitationCode });
        }

        const user = await User.create({
            name,
            username,
            email,
            phone: isAdminRegistration ? "" : phone,
            bankName: isAdminRegistration ? "" : bankName,
            accountNumber: isAdminRegistration ? "" : accountNumber,
            password: hashed,
            planType: isAdminRegistration ? "5k" : planType,
            referralCode,
            invitedBy: invitedByUser ? invitedByUser._id : null,
            usedCouponCode: isAdminRegistration ? undefined : couponCode,
            isAdmin: isAdminRegistration ? true : false,
        });

        // Mark coupon used (only for normal users)
        if (!isAdminRegistration && coupon) {
            coupon.status = "used";
            coupon.assignedUser = user._id;
            await coupon.save();
        }

        // Referral reward
        if (!isAdminRegistration && invitedByUser) {
            const rewardBase = 500; // base for 5k
            const multiplier = planType === "5k" ? 1 : planType === "10k" ? 2 : 5;
            const reward = rewardBase * multiplier;
            invitedByUser.referralBalance += reward;
            await invitedByUser.save();
        }

        const token = signToken(user);
        res
            .cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 })
            .status(201)
            .json({ 
                message: "Registered", 
                token, 
                user: { 
                    id: user._id, 
                    name: user.name, 
                    username: user.username, 
                    planType: user.planType, 
                    referralCode: user.referralCode 
                } 
            });
    } catch (err) {
        console.error("Registration error:", err);
        
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({ message: `Validation error: ${errors}` });
        }
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        
        res.status(500).json({ message: err.message || "Server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
        if (!user) return res.status(400).json({ message: "Incorrect email or username" });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ message: "Incorrect password" });

        const token = signToken(user);
        res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 }).json({ message: "Logged in", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/me", (req, res) => {
    try {
        const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(" ")[1] : undefined);
        console.log('Received token for /auth/me:', token);
        if (!token) return res.status(401).json({ message: "Unauthorized: No token received" });
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            res.json(payload);
        } catch (verifyErr) {
            console.error('JWT verification error:', verifyErr.message);
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    } catch (err) {
        console.error('General /auth/me error:', err.message);
        return res.status(401).json({ message: "Unauthorized: Server error" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token").json({ message: "Logged out" });
});

module.exports = router;



