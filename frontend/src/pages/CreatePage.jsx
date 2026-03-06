import { useEffect, useRef, useState } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"
import toast from "react-hot-toast"
import axiosInstance from "../lib/axios.js"

const CreatePage = () => {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [tagsInput, setTagsInput] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState("")
    const [loading, setLoading] = useState(false)

    const fileInputRef = useRef(null)
    const contentRef = useRef(null)

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title || !content) {
            toast.error("All fields are required")
            return
        }
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append("title", title)
            formData.append("content", content)
            formData.append("tags", tagsInput)
            if (imageFile) {
                formData.append("image", imageFile)
            }

            await axiosInstance.post("/notes", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            toast.success("Note created successfully")
            navigate("/")
        } catch (error) {
            if (error.response && error.response.status === 429) {
                toast.error("You trying to create notes too fast!", {
                    duration: 4000,
                    icon: "💀"
                })
            }
            else {
                toast.error("Error creating notes")
            }
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!imagePreview) return
        return () => URL.revokeObjectURL(imagePreview)
    }, [imagePreview])

    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null
        setImageFile(file)
        if (file) {
            setImagePreview(URL.createObjectURL(file))
        } else {
            setImagePreview("")
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview("")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
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

    return <div className="min-h-screen bg-base-200">
        <div className="container mx-auto px-4 py-10">
            <div className="max-w-2xl mx-auto">
                <Link to={"/"} className="btn btn-ghost mb-4">
                    <ArrowLeftIcon className="size-5" /> Back
                </Link>

                <div className="card bg-base-100" >
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4"> Create New Note</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Title</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Note Title"
                                    className="input input-bordered"
                                    value={title}
                                    onChange={(e) => { setTitle(e.target.value) }}
                                />
                            </div>

                            <div className="form-control mb-4">
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
                                    placeholder="Write your note here..."
                                    className="textarea textarea-bordered"
                                    rows={6}
                                    value={content}
                                    onChange={(e) => { setContent(e.target.value) }}
                                />
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Tags</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. math, homework, physics"
                                    className="input input-bordered"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                />
                                <p className="text-xs text-base-content/60 mt-1">Separate tags with commas.</p>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Image (optional)</span>
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    className="file-input file-input-bordered w-full"
                                    onChange={handleImageChange}
                                />
                                {imagePreview && (
                                    <div className="mt-3 space-y-2">
                                        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-base-200 p-2">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={handleRemoveImage}
                                        >
                                            Remove image
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="card-actions justify-end">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? "Creating..." : "Create Note"}
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default CreatePage