import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import crypto from "crypto"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

const getConfig = () => ({
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL,
})

const getS3Client = () => {
    const { region } = getConfig()
    return new S3Client({ region })
}

const ensureS3Config = () => {
    const { bucket, region } = getConfig()
    if (!bucket || !region) {
        throw new Error("S3 configuration is missing")
    }
}

const normalizeBaseUrl = (value) => {
    if (!value) return null
    return value.endsWith("/") ? value.slice(0, -1) : value
}

const buildPublicUrl = (key) => {
    const { bucket, region, publicBaseUrl } = getConfig()
    const baseUrl = normalizeBaseUrl(publicBaseUrl)
    if (baseUrl) {
        return `${baseUrl}/${key}`
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

const buildKey = (originalName) => {
    const ext = path.extname(originalName || "").toLowerCase()
    const safeExt = ext || ".jpg"
    const token = crypto.randomBytes(16).toString("hex")
    return `notes/${Date.now()}-${token}${safeExt}`
}

export const isS3Enabled = () => Boolean(process.env.S3_UPLOADS === "true")

export const uploadBufferToS3 = async ({ buffer, contentType, originalName }) => {
    ensureS3Config()
    const key = buildKey(originalName)
    const command = new PutObjectCommand({
        Bucket: getConfig().bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    })
    await getS3Client().send(command)
    return { key, url: buildPublicUrl(key) }
}

export const deleteFromS3 = async (key) => {
    if (!key) return
    ensureS3Config()
    const command = new DeleteObjectCommand({
        Bucket: getConfig().bucket,
        Key: key,
    })
    await getS3Client().send(command)
}
