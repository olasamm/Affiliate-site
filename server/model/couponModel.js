const mongoose = require("mongoose");
const couponSchema = require("../schemas/couponSchema");

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;



