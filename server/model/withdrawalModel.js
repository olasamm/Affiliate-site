const mongoose = require("mongoose");
const withdrawalSchema = require("../schemas/withdrawalSchema");

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

module.exports = Withdrawal;



