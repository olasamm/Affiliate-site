const mongoose = require("mongoose");
const referralSchema = require("../schemas/referralSchema");

const Referral = mongoose.model("Referral", referralSchema);

module.exports = Referral;



