import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, "..", "..", "uploads")

fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, uploadsDir)
    },
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const safeName = `image-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
        cb(null, safeName)
    },
})

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"])

const fileFilter = (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
        req.fileValidationError = "Only JPG, PNG, or WEBP images are allowed"
        return cb(null, false)
    }
    return cb(null, true)
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
})

export default upload
