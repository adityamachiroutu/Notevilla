import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

import notesRoutes from "./routes/notesRoutes.js"
import { connectDB } from "./config/db.js"
import rateLimiter from "./middleware/rateLimiter.js"

dotenv.config()

const app = express();
const PORT = process.env.PORT || 5001
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

//middleware
app.use(
    cors({
        origin: "http://localhost:5173"
    })
)
app.use(express.json())           //this middleware parses the JSON bodies: req.body
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))
app.use(rateLimiter)
app.use("/api/notes", notesRoutes)

app.use((err, req, res, next) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image too large. Max size is 5MB." })
    }
    if (err?.message?.includes("Only JPG")) {
        return res.status(400).json({ message: err.message })
    }
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
})

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running on port 5001")
    })
});