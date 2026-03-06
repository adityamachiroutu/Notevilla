import { API_BASE_URL } from "./axios.js"

export function formatDate(date) {
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export function resolveImageUrl(imageUrl) {
    if (!imageUrl) return ""
    if (imageUrl.startsWith("http")) return imageUrl
    return `${API_BASE_URL}${imageUrl}`
}