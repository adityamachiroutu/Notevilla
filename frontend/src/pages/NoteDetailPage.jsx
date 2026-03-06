import { useEffect, useRef, useState } from "react"
import { ArrowLeftIcon, PenSquareIcon, PinIcon, Trash2Icon } from "lucide-react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import toast from "react-hot-toast"
import ReactMarkdown from "react-markdown"
import { diffWords } from "diff"
import RateLimitedUI from "../Components/RateLimitedUI.jsx"
import axiosInstance from "../lib/axios.js"
import { formatDate, resolveImageUrl } from "../lib/utils.js"
import { markdownPlugins } from "../lib/markdown.js"
import { useAuth } from "../contexts/AuthContext.jsx"

const NoteDetailPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const [note, setNote] = useState(null)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [tagsInput, setTagsInput] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState("")
    const [removeImage, setRemoveImage] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [versions, setVersions] = useState([])
    const [loadingVersions, setLoadingVersions] = useState(false)
    const [selectedVersion, setSelectedVersion] = useState(null)
    const [restoring, setRestoring] = useState(false)
    const [isEditing, setIsEditing] = useState(Boolean(location.state?.edit))
    const [isRateLimited, setIsRateLimited] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const fileInputRef = useRef(null)
    const contentRef = useRef(null)
    const { user } = useAuth()

    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true)
            setNotFound(false)
            setNote(null)
            setIsEditing(Boolean(location.state?.edit))
            try {
                const res = await axiosInstance.get(`/notes/${id}`)
                setNote(res.data)
                setTitle(res.data?.title || "")
                setContent(res.data?.content || "")
                setTagsInput((res.data?.tags || []).join(", "))
                setImageFile(null)
                setImagePreview("")
                setRemoveImage(false)
                setIsRateLimited(false)
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    setNotFound(true)
                } else if (error.response && error.response.status === 429) {
                    setIsRateLimited(true)
                } else {
                    toast.error("Failed to load note")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchNote()
    }, [id, location.state])

    useEffect(() => {
        if (!note) return
        const ownerId = note?.userId?._id || note?.userId
        const isOwner = Boolean(user && ownerId === user.id)
        if (!isOwner && isEditing) {
            setIsEditing(false)
        }
    }, [note, user, isEditing])

    useEffect(() => {
        if (!showHistory) return
        const fetchVersions = async () => {
            setLoadingVersions(true)
            try {
                const res = await axiosInstance.get(`/notes/${id}/versions`)
                setVersions(res.data)
            } catch (error) {
                toast.error("Failed to load history")
            } finally {
                setLoadingVersions(false)
            }
        }

        fetchVersions()
    }, [showHistory, id])

    useEffect(() => {
        if (!imagePreview) return
        return () => URL.revokeObjectURL(imagePreview)
    }, [imagePreview])

    const handleUpdate = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("All fields are required")
            return
        }

        setSaving(true)
        setIsRateLimited(false)
        try {
            const formData = new FormData()
            formData.append("title", title.trim())
            formData.append("content", content.trim())
            formData.append("tags", tagsInput)
            if (imageFile) {
                formData.append("image", imageFile)
            }
            if (removeImage) {
                formData.append("removeImage", "true")
            }

            const res = await axiosInstance.put(`/notes/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            setNote(res.data)
            setTitle(res.data?.title || "")
            setContent(res.data?.content || "")
            setTagsInput((res.data?.tags || []).join(", "))
            setImageFile(null)
            setImagePreview("")
            setRemoveImage(false)
            setIsEditing(false)
            toast.success("Note updated successfully")
            if (showHistory) {
                const historyRes = await axiosInstance.get(`/notes/${id}/versions`)
                setVersions(historyRes.data)
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setIsRateLimited(true)
                toast.error("You are updating notes too fast")
            } else {
                toast.error("Failed to update note")
            }
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setTitle(note?.title || "")
        setContent(note?.content || "")
        setTagsInput((note?.tags || []).join(", "))
        setImageFile(null)
        setImagePreview("")
        setRemoveImage(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
        setIsEditing(false)
    }

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this note?")) return

        setDeleting(true)
        setIsRateLimited(false)
        try {
            await axiosInstance.delete(`/notes/${id}`)
            toast.success("Note deleted")
            navigate("/")
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setIsRateLimited(true)
                toast.error("You are deleting notes too fast")
            } else {
                toast.error("Failed to delete note")
            }
        } finally {
            setDeleting(false)
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null
        setImageFile(file)
        setRemoveImage(false)
        if (file) {
            setImagePreview(URL.createObjectURL(file))
        } else {
            setImagePreview("")
        }
    }

    const handleRemoveImage = () => {
        if (removeImage) {
            setRemoveImage(false)
            return
        }

        setImageFile(null)
        setImagePreview("")
        setRemoveImage(true)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleTogglePin = async () => {
        try {
            const res = await axiosInstance.patch(`/notes/${id}/pin`, {
                pinned: !note?.pinned,
            })
            setNote(res.data)
            toast.success(res.data.pinned ? "Note pinned" : "Note unpinned")
        } catch (error) {
            toast.error("Failed to update pin")
        }
    }

    const applyFormat = (prefix, suffix = prefix) => {
        const textarea = contentRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selected = content.slice(start, end) || "text"
        const nextValue = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`

        setContent(nextValue)

        requestAnimationFrame(() => {
            textarea.focus()
            const selectionStart = start + prefix.length
            const selectionEnd = selectionStart + selected.length
            textarea.setSelectionRange(selectionStart, selectionEnd)
        })
    }

    const renderDiff = (previous, current) => {
        const parts = diffWords(previous || "", current || "")
        return parts.map((part, index) => {
            let className = "text-base-content/80"
            if (part.added) className = "bg-success/20 text-success-content"
            if (part.removed) className = "bg-error/20 text-error-content line-through"
            return (
                <span key={`${index}-${part.value}`} className={className}>
                    {part.value}
                </span>
            )
        })
    }

    const handleRollback = async (revisionId) => {
        if (!window.confirm("Restore this version?")) return

        setRestoring(true)
        try {
            const res = await axiosInstance.post(`/notes/${id}/versions/${revisionId}/rollback`)
            setNote(res.data)
            setTitle(res.data?.title || "")
            setContent(res.data?.content || "")
            setTagsInput((res.data?.tags || []).join(", "))
            setImageFile(null)
            setImagePreview("")
            setRemoveImage(false)
            setIsEditing(false)
            setSelectedVersion(null)
            const historyRes = await axiosInstance.get(`/notes/${id}/versions`)
            setVersions(historyRes.data)
            toast.success("Version restored")
        } catch (error) {
            toast.error("Failed to restore version")
        } finally {
            setRestoring(false)
        }
    }

    const createdAt = note?.createdAt ? formatDate(new Date(note.createdAt)) : ""
    const updatedAt = note?.updatedAt ? formatDate(new Date(note.updatedAt)) : ""
    const ownerName = note?.userId?.username || "Unknown"
    const ownerId = note?.userId?._id || note?.userId
    const isOwner = Boolean(user && ownerId === user.id)
    const existingImageUrl = resolveImageUrl(note?.imageUrl)
    const displayImageUrl = imagePreview || (!removeImage ? existingImageUrl : "")
    const tags = note?.tags || []

    return (
        <div className="min-h-screen bg-base-200">
            <div className="container mx-auto px-4 py-10">
                <div className="max-w-3xl mx-auto">
                    <Link to="/" className="btn btn-ghost mb-4">
                        <ArrowLeftIcon className="size-5" /> Back
                    </Link>

                    {isRateLimited && <RateLimitedUI />}

                    {loading && (
                        <div className="text-center text-primary py-10">Loading note...</div>
                    )}

                    {!loading && notFound && (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body items-center text-center gap-3">
                                <h2 className="card-title text-2xl">Note not found</h2>
                                <p className="text-base-content/70">
                                    The note you are looking for does not exist.
                                </p>
                                <Link to="/" className="btn btn-primary">Go back home</Link>
                            </div>
                        </div>
                    )}

                    {!loading && note && (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body gap-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="card-title text-2xl">
                                            {isEditing ? "Edit note" : "Note details"}
                                        </h2>
                                        <p className="text-sm text-base-content/60">
                                            By {ownerName}
                                            {(createdAt || updatedAt) && " | "}
                                            {createdAt && `Created ${createdAt}`}
                                            {createdAt && updatedAt && " | "}
                                            {updatedAt && `Updated ${updatedAt}`}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {!isEditing && isOwner && (
                                            <button
                                                className="btn btn-ghost"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <PenSquareIcon className="size-4" />
                                                Edit
                                            </button>
                                        )}
                                        {!isEditing && isOwner && (
                                            <button
                                                className={`btn btn-ghost ${note?.pinned ? "text-primary" : ""}`}
                                                onClick={handleTogglePin}
                                            >
                                                <PinIcon className="size-4" />
                                                {note?.pinned ? "Unpin" : "Pin"}
                                            </button>
                                        )}
                                        {!isEditing && isOwner && (
                                            <button
                                                className="btn btn-ghost"
                                                onClick={() => setShowHistory((prev) => !prev)}
                                            >
                                                {showHistory ? "Hide history" : "History"}
                                            </button>
                                        )}
                                        {isEditing && isOwner && (
                                            <>
                                                <button
                                                    className="btn btn-ghost"
                                                    onClick={handleCancel}
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleUpdate}
                                                    disabled={saving}
                                                >
                                                    {saving ? "Saving..." : "Save changes"}
                                                </button>
                                            </>
                                        )}
                                        {isOwner && (
                                            <button
                                                className="btn btn-error btn-outline"
                                                onClick={handleDelete}
                                                disabled={deleting}
                                            >
                                                <Trash2Icon className="size-4" />
                                                {deleting ? "Deleting..." : "Delete"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {displayImageUrl && (
                                    <div className="rounded-lg border border-base-300 bg-base-200 p-3">
                                        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-base-200 p-2">
                                            <img
                                                src={displayImageUrl}
                                                alt={note.title}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Update image</span>
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            className="file-input file-input-bordered w-full"
                                            onChange={handleImageChange}
                                        />
                                        {(existingImageUrl || imagePreview || removeImage) && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm mt-2"
                                                onClick={handleRemoveImage}
                                            >
                                                {removeImage ? "Undo remove" : "Remove image"}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Title</span>
                                        </label>
                                        <input
                                            className="input input-bordered"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-sm text-base-content/60">Title</p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-semibold text-base-content">
                                                {note.title}
                                            </h3>
                                            {note.pinned && (
                                                <span className="badge badge-primary badge-sm">Pinned</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Content</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs"
                                                onClick={() => applyFormat("**")}
                                            >
                                                Bold
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs"
                                                onClick={() => applyFormat("*")}
                                            >
                                                Italic
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs"
                                                onClick={() => applyFormat("<u>", "</u>")}
                                            >
                                                Underline
                                            </button>
                                        </div>
                                        <textarea
                                            ref={contentRef}
                                            className="textarea textarea-bordered"
                                            rows={8}
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-base-content/60">Content</p>
                                        <div className="rounded-lg border border-base-300 bg-base-200 p-4">
                                            <ReactMarkdown
                                                {...markdownPlugins}
                                                className="space-y-3 text-base-content"
                                            >
                                                {note.content || ""}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Tags</span>
                                        </label>
                                        <input
                                            className="input input-bordered"
                                            placeholder="e.g. math, homework, physics"
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                        />
                                        <p className="text-xs text-base-content/60 mt-1">Separate tags with commas.</p>
                                    </div>
                                ) : (
                                    tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag) => (
                                                <span key={tag} className="badge badge-outline">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )
                                )}

                                {showHistory && !isEditing && isOwner && (
                                    <div className="rounded-lg border border-base-300 bg-base-200 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold">Version history</h3>
                                            <span className="text-xs text-base-content/60">
                                                {versions.length} version{versions.length === 1 ? "" : "s"}
                                            </span>
                                        </div>

                                        {loadingVersions && (
                                            <div className="text-sm text-base-content/60">Loading history...</div>
                                        )}

                                        {!loadingVersions && versions.length === 0 && (
                                            <div className="text-sm text-base-content/60">
                                                No previous versions yet.
                                            </div>
                                        )}

                                        {!loadingVersions && versions.length > 0 && (
                                            <div className="grid gap-3">
                                                {versions.map((version) => (
                                                    <button
                                                        key={version._id}
                                                        type="button"
                                                        className={`btn btn-ghost justify-between ${selectedVersion?._id === version._id
                                                            ? "bg-base-300"
                                                            : ""
                                                            }`}
                                                        onClick={() => setSelectedVersion(version)}
                                                    >
                                                        <span className="truncate">
                                                            {version.title || "Untitled"}
                                                        </span>
                                                        <span className="text-xs text-base-content/60">
                                                            {formatDate(new Date(version.createdAt))}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {selectedVersion && (
                                            <div className="mt-4 space-y-3">
                                                <div className="text-xs text-base-content/60">
                                                    Diff against current note
                                                </div>
                                                <div className="rounded-lg border border-base-300 bg-base-100 p-3 text-sm">
                                                    <div className="mb-2 font-semibold">Title</div>
                                                    <div className="leading-relaxed">
                                                        {renderDiff(selectedVersion.title, note.title)}
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-base-300 bg-base-100 p-3 text-sm">
                                                    <div className="mb-2 font-semibold">Content</div>
                                                    <div className="leading-relaxed whitespace-pre-wrap">
                                                        {renderDiff(selectedVersion.content, note.content)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => handleRollback(selectedVersion._id)}
                                                        disabled={restoring}
                                                    >
                                                        {restoring ? "Restoring..." : "Restore this version"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setSelectedVersion(null)}
                                                    >
                                                        Clear selection
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default NoteDetailPage