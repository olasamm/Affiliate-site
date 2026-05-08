const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const Coupon = require("../model/couponModel");
const CouponPayment = require("../model/couponPaymentModel");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const router = express.Router();

function signToken(user) {
    return jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}

let mailTransporter = null;
function getMailer() {
    if (mailTransporter) return mailTransporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

    mailTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
    return mailTransporter;
}

async function sendCouponEmail({ to, couponCode, planType, amount }) {
    const transporter = getMailer();
    if (!transporter) return false;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const subject = "Your Affiliate Coupon Code";
    const text = `Payment successful.\n\nYour coupon code: ${couponCode}\nPlan: ${planType}\nAmount: ₦${amount}\n\nUse this code during signup.\n`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Payment Successful</h2>
        <p>Your coupon code is ready:</p>
        <p style="font-size: 20px; font-weight: 700; letter-spacing: 1px;">${couponCode}</p>
        <p>Plan: <b>${planType}</b><br/>Amount: <b>₦${amount}</b></p>
        <p>Use this code during signup.</p>
      </div>
    `;

    await transporter.sendMail({ from, to, subject, text, html });
    return true;
}

const PLAN_PRICES = {
    "5k": 5000,
    "10k": 10000,
    "15k": 15000,
};

function generateCouponCode(prefix = "CPN") {
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `${prefix}-${random}`;
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

            // Record transaction for referral reward
            try {
                await Transaction.create({
                    userId: invitedByUser._id,
                    type: "referral",
                    amount: reward,
                    meta: { referredUserId: user._id, referredUsername: username }
                });
            } catch (txErr) {
                console.error("Failed to create referral transaction:", txErr);
            }
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

router.post("/coupon-payment/initiate", async (req, res) => {
    try {
        const { email, planType } = req.body;
        if (!email || !planType) return res.status(400).json({ message: "email and planType are required" });
        if (!PLAN_PRICES[planType]) return res.status(400).json({ message: "Invalid planType" });
        if (!process.env.PAYSTACK_SECRET_KEY) return res.status(500).json({ message: "PAYSTACK_SECRET_KEY is not configured" });

        const amount = PLAN_PRICES[planType];
        const reference = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const callbackUrl = `${(process.env.FRONTEND_URL || "https://affiliate-site-5l6g.vercel.app").replace(/\/+$/, "")}/#/signup`;

        await CouponPayment.create({ reference, email, planType, amount, status: "initialized" });

        const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                amount: amount * 100, // kobo
                reference,
                callback_url: callbackUrl,
                metadata: { planType },
            }),
        });

        const initData = await initRes.json();
        if (!initRes.ok || !initData?.status) {
            return res.status(400).json({ message: initData?.message || "Failed to initialize payment" });
        }

        return res.json({
            authorizationUrl: initData.data.authorization_url,
            reference,
        });
    } catch (err) {
        console.error("coupon-payment/initiate error:", err);
        return res.status(500).json({ message: "Failed to initialize coupon payment" });
    }
});

router.get("/coupon-payment/verify", async (req, res) => {
    try {
        const { reference } = req.query;
        if (!reference) return res.status(400).json({ message: "reference is required" });
        if (!process.env.PAYSTACK_SECRET_KEY) return res.status(500).json({ message: "PAYSTACK_SECRET_KEY is not configured" });

        const payment = await CouponPayment.findOne({ reference });
        if (!payment) return res.status(404).json({ message: "Payment record not found" });

        // Idempotent: if already successful, reuse issued coupon
        if (payment.status === "success" && payment.couponCode) {
            return res.json({ message: "Payment already verified", couponCode: payment.couponCode, planType: payment.planType });
        }

        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData?.status || verifyData?.data?.status !== "success") {
            payment.status = "failed";
            await payment.save();
            return res.status(400).json({ message: verifyData?.message || "Payment verification failed" });
        }

        // Create a unique coupon and persist
        let code = generateCouponCode("CPN");
        while (await Coupon.findOne({ code })) {
            code = generateCouponCode("CPN");
        }

        await Coupon.create({
            code,
            planType: payment.planType,
            amount: payment.amount,
            status: "unused",
        });

        payment.status = "success";
        payment.couponCode = code;
        await payment.save();

        // Best-effort email delivery (does not block coupon issuance)
        try {
            await sendCouponEmail({
                to: payment.email,
                couponCode: code,
                planType: payment.planType,
                amount: payment.amount,
            });
        } catch (mailErr) {
            console.error("Coupon email send failed:", mailErr?.message || mailErr);
        }

        return res.json({ message: "Payment verified", couponCode: code, planType: payment.planType });
    } catch (err) {
        console.error("coupon-payment/verify error:", err);
        return res.status(500).json({ message: "Failed to verify coupon payment" });
    }
});

module.exports = router;
