import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
        },
        usernameLower: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
)

const User = mongoose.model("User", userSchema)

export default User
