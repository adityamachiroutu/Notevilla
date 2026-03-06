import jwt from "jsonwebtoken"
import User from "../models/User.js"

const TOKEN_COOKIE = "auth_token"

export const requireAuth = async (req, res, next) => {
    const token = req.cookies?.[TOKEN_COOKIE]
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "Server misconfiguration" })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(payload.id).select("username")
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        req.user = { id: user._id.toString(), username: user.username }
        return next()
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" })
    }
}
