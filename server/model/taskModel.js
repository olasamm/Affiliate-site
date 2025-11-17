const mongoose = require("mongoose");
const taskSchema = require("../schemas/taskSchema");

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;



