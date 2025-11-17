const mongoose = require("mongoose");
const userSchema = require("../schemas/userSchemas");

const User = mongoose.model("User", userSchema);

module.exports = User;