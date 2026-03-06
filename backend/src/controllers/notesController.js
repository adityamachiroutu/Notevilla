import Note from "../models/Note.js"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, "..", "..", "uploads")
const MAX_REVISIONS = 20

const parseBoolean = (value) => {
    if (value === undefined || value === null) return undefined
    if (typeof value === "boolean") return value
    if (typeof value === "string") return value.toLowerCase() === "true"
    return Boolean(value)
}

const parseTags = (rawTags) => {
    if (!rawTags) return []
    if (Array.isArray(rawTags)) {
        return [...new Set(rawTags.map((tag) => String(tag).trim()).filter(Boolean))]
    }

    if (typeof rawTags === "string") {
        const trimmed = rawTags.trim()
        if (!trimmed) return []
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                const parsed = JSON.parse(trimmed)
                if (Array.isArray(parsed)) {
                    return [...new Set(parsed.map((tag) => String(tag).trim()).filter(Boolean))]
                }
            } catch (_) {
                // fall through to comma split
            }
        }

        return [...new Set(trimmed.split(",").map((tag) => tag.trim()).filter(Boolean))]
    }

    return []
}

const getLocalImagePath = (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith("/uploads/")) return null
    const fileName = imageUrl.replace("/uploads/", "")
    return path.join(uploadsDir, fileName)
}

const deleteImageIfExists = async (imageUrl) => {
    const filePath = getLocalImagePath(imageUrl)
    if (!filePath) return
    try {
        await fs.unlink(filePath)
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Failed to delete image", error)
        }
    }
}

const createRevisionSnapshot = (note) => ({
    title: note.title,
    content: note.content,
    imageUrl: note.imageUrl,
    tags: note.tags || [],
    createdAt: new Date(),
})

const trimRevisions = (note) => {
    if (note.revisions.length > MAX_REVISIONS) {
        note.revisions = note.revisions.slice(-MAX_REVISIONS)
    }
}

export async function getAllNotes(_, res) {
    try {
        const notes = await Note.find()
            .select("-revisions")
            .sort({ pinned: -1, pinnedAt: -1, createdAt: -1 })
        console.log(notes)
        res.status(200).send(notes);
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error" })
    }

}

export async function getNoteById(req, res) {
    try {
        const note = await Note.findById(req.params.id)
        if (!note) return res.status(404).json({ message: "Post does not exist" })
        res.status(200).json(note)
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error" })
    }

}

export async function createNote(req, res) {
    try {
        const { title, content, tags, pinned } = req.body
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError })
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null
        const parsedTags = parseTags(tags)
        const parsedPinned = parseBoolean(pinned) || false
        const newNode = new Note({
            title,
            content,
            imageUrl,
            tags: parsedTags,
            pinned: parsedPinned,
            pinnedAt: parsedPinned ? new Date() : null,
        })

        const savedNode = await newNode.save()

        console.log(title, content)
        res.status(201).json(savedNode)
    }
    catch (error) {
        if (req.file) {
            await deleteImageIfExists(`/uploads/${req.file.filename}`)
        }
        console.error(error)
        res.status(500).json({ message: "Internal server error" })
    }

}

export async function updateNote(req, res) {
    try {
        const { title, content, removeImage, tags, pinned } = req.body
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError })
        }

        const note = await Note.findById(req.params.id)
        if (!note) {
            if (req.file) {
                await deleteImageIfExists(`/uploads/${req.file.filename}`)
            }
            return res.status(404).json({ message: "fields are wrong" })
        }

        const shouldRemoveImage = removeImage === "true" || removeImage === true
        const parsedPinned = parseBoolean(pinned)
        const shouldSnapshot =
            title !== undefined ||
            content !== undefined ||
            tags !== undefined ||
            req.file ||
            shouldRemoveImage

        if (shouldSnapshot) {
            note.revisions.push(createRevisionSnapshot(note))
            trimRevisions(note)
        }

        if (title !== undefined) note.title = title
        if (content !== undefined) note.content = content
        if (tags !== undefined) note.tags = parseTags(tags)

        if (parsedPinned !== undefined) {
            note.pinned = parsedPinned
            note.pinnedAt = parsedPinned ? new Date() : null
        }

        if (req.file) {
            note.imageUrl = `/uploads/${req.file.filename}`
        } else if (shouldRemoveImage) {
            note.imageUrl = null
        }

        const updatedNote = await note.save()

        res.status(200).json(updatedNote)
    }
    catch (error) {
        if (req.file) {
            await deleteImageIfExists(`/uploads/${req.file.filename}`)
        }
        console.log(error)
        res.status(500).json({ message: "internal servor error" })
    }
}

export async function deleteNote(req, res) {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id)
        if (!deletedNote) return res.status(404).json({ message: "Post does not exist" })
        const imageUrls = new Set([
            deletedNote.imageUrl,
            ...(deletedNote.revisions || []).map((revision) => revision.imageUrl),
        ])
        for (const imageUrl of imageUrls) {
            await deleteImageIfExists(imageUrl)
        }
        res.status(200).json(deletedNote)
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error" })
    }
}

export async function togglePin(req, res) {
    try {
        const note = await Note.findById(req.params.id)
        if (!note) return res.status(404).json({ message: "Post does not exist" })

        const parsedPinned = parseBoolean(req.body?.pinned)
        const nextPinned = parsedPinned !== undefined ? parsedPinned : !note.pinned

        note.pinned = nextPinned
        note.pinnedAt = nextPinned ? new Date() : null

        const updatedNote = await note.save()
        res.status(200).json(updatedNote)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error" })
    }
}

export async function getNoteRevisions(req, res) {
    try {
        const note = await Note.findById(req.params.id)
        if (!note) return res.status(404).json({ message: "Post does not exist" })

        const revisions = [...note.revisions].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )

        res.status(200).json(revisions)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error" })
    }
}

export async function rollbackNoteRevision(req, res) {
    try {
        const { id, revisionId } = req.params
        const note = await Note.findById(id)
        if (!note) return res.status(404).json({ message: "Post does not exist" })

        const revision = note.revisions.id(revisionId)
        if (!revision) return res.status(404).json({ message: "Revision not found" })

        note.revisions.push(createRevisionSnapshot(note))
        trimRevisions(note)

        note.title = revision.title
        note.content = revision.content
        note.tags = revision.tags || []
        note.imageUrl = revision.imageUrl || null

        const updatedNote = await note.save()

        res.status(200).json(updatedNote)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error" })
    }
}