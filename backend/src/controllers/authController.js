import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const TOKEN_COOKIE = "auth_token"
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const buildCookieOptions = () => ({
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
})

const signToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not set")
    }
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

const sanitizeUser = (user) => ({
    id: user._id.toString(),
    username: user.username,
})

export const register = async (req, res) => {
    try {
        const username = String(req.body?.username || "").trim()
        const password = String(req.body?.password || "")

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" })
        }
        if (username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" })
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const usernameLower = username.toLowerCase()
        const existingUser = await User.findOne({ usernameLower })
        if (existingUser) {
            return res.status(409).json({ message: "Username is already taken" })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await User.create({
            username,
            usernameLower,
            passwordHash,
        })

        const token = signToken(user._id)
        res.cookie(TOKEN_COOKIE, token, buildCookieOptions())
        return res.status(201).json({ user: sanitizeUser(user) })
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "Username is already taken" })
        }
        console.error(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const login = async (req, res) => {
    try {
        const username = String(req.body?.username || "").trim()
        const password = String(req.body?.password || "")

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" })
        }

        const user = await User.findOne({ usernameLower: username.toLowerCase() })
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const matches = await bcrypt.compare(password, user.passwordHash)
        if (!matches) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const token = signToken(user._id)
        res.cookie(TOKEN_COOKIE, token, buildCookieOptions())
        return res.status(200).json({ user: sanitizeUser(user) })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const logout = (req, res) => {
    res.clearCookie(TOKEN_COOKIE, buildCookieOptions())
    return res.status(200).json({ message: "Logged out" })
}

export const me = (req, res) => {
    return res.status(200).json({ user: req.user })
}
