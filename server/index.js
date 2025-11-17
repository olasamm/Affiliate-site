const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

const URI = process.env.uri;
const port = process.env.PORT

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

mongoose
    .connect(URI)
    .then(async () => {
        console.log("Connected to MongoDB");

        const User = require("./model/userModel");
        
        // Drop legacy index
        try {
            await User.collection.dropIndex("mail_1");
            console.log("Dropped legacy index mail_1");
        } catch (err) {
            // Index might not exist, ignore error
        }

        // Clean up documents with null or missing usernames before syncing indexes
        try {
            // Find all users with null or missing username using raw MongoDB query
            const usersWithNullUsername = await User.collection.find({ 
                $or: [
                    { username: null },
                    { username: { $exists: false } }
                ]
            }).toArray();
            
            if (usersWithNullUsername.length > 0) {
                console.log(`Found ${usersWithNullUsername.length} user(s) with null/missing username. Cleaning up...`);
                
                let fixedCount = 0;
                let deletedCount = 0;
                
                for (const user of usersWithNullUsername) {
                    // Check if user has required fields (name, email, planType)
                    const hasRequiredFields = user.name && user.email && user.planType;
                    
                    if (!hasRequiredFields) {
                        // Delete invalid users missing required fields
                        await User.collection.deleteOne({ _id: user._id });
                        deletedCount++;
                        console.log(`Deleted invalid user ${user._id} (missing required fields)`);
                    } else {
                        // Generate a unique username based on email or ID
                        let newUsername = user.email 
                            ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
                            : `user_${user._id.toString().slice(-8)}`;
                        
                        // Ensure uniqueness by appending a random suffix if needed
                        let uniqueUsername = newUsername;
                        let counter = 1;
                        while (await User.collection.findOne({ username: uniqueUsername })) {
                            uniqueUsername = `${newUsername}_${counter}`;
                            counter++;
                        }
                        
                        // Update directly using MongoDB collection to bypass Mongoose validation
                        await User.collection.updateOne(
                            { _id: user._id },
                            { $set: { username: uniqueUsername } }
                        );
                        fixedCount++;
                        console.log(`Assigned username "${uniqueUsername}" to user ${user._id}`);
                    }
                }
                
                console.log(`Cleanup completed: ${fixedCount} fixed, ${deletedCount} deleted`);
            }
            
            // Final check: Ensure no documents with null username remain before syncing
            const remainingNullUsernames = await User.collection.countDocuments({
                $or: [
                    { username: null },
                    { username: { $exists: false } },
                    { username: "" }
                ]
            });
            
            if (remainingNullUsernames > 0) {
                console.log(`Warning: ${remainingNullUsernames} user(s) still have null/missing username. Deleting them...`);
                await User.collection.deleteMany({
                    $or: [
                        { username: null },
                        { username: { $exists: false } },
                        { username: "" }
                    ]
                });
                console.log(`Deleted ${remainingNullUsernames} remaining invalid user(s)`);
            }
        } catch (cleanupErr) {
            console.log("Error during cleanup:", cleanupErr.message);
        }

        // Now sync indexes
        try {
            await User.syncIndexes();
            console.log("User indexes synced");
        } catch (e) {
            console.log("Index sync error", e.message);
        }
    })
    .catch((err) => {
        console.log(err);
    });

// Routes
app.get("/", (req, res) => {
    res.send("Affiliate API is running");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/user", require("./routes/userRoutes"));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
