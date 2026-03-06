import express from "express"
import {
    createNote,
    deleteNote,
    getAllNotes,
    updateNote,
    getNoteById,
    getNoteRevisions,
    rollbackNoteRevision,
    togglePin,
} from "../controllers/notesController.js"
import { requireAuth } from "../middleware/auth.js"
import upload from "../middleware/upload.js"
const router = express.Router();

router.use(requireAuth)

router.get("/", getAllNotes)
router.get("/:id", getNoteById)
router.get("/:id/versions", getNoteRevisions)
router.post("/", upload.single("image"), createNote)
router.put("/:id", upload.single("image"), updateNote)
router.post("/:id/versions/:revisionId/rollback", rollbackNoteRevision)
router.patch("/:id/pin", togglePin)
router.delete("/:id", deleteNote)

export default router