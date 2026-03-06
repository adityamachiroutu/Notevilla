import { Link, useNavigate } from "react-router"
import { PenSquareIcon, PinIcon, Trash2Icon } from "lucide-react";
import { formatDate, resolveImageUrl } from "../lib/utils.js"
import axiosInstance from "../lib/axios.js";
import { toast } from "react-hot-toast"
import ReactMarkdown from "react-markdown"
import { markdownPlugins } from "../lib/markdown.js"

const NoteCard = ({ note, setNotes }) => {
    const navigate = useNavigate()

    const handleEdit = () => {
        navigate(`/note/${note._id}`, { state: { edit: true } })
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        try {
            await axiosInstance.delete(`/notes/${id}`);
            setNotes((prev) => prev.filter(note => note._id !== id))
            toast.success("Successfully deleted this note")
        } catch (error) {
            console.log("error in handleDelete", error)
            toast.error("There was an error deleting this note")
        }

    }

    const handleTogglePin = async () => {
        try {
            const res = await axiosInstance.patch(`/notes/${note._id}/pin`, {
                pinned: !note.pinned,
            })
            setNotes((prev) => prev.map((item) => (
                item._id === note._id ? { ...item, pinned: res.data.pinned, pinnedAt: res.data.pinnedAt } : item
            )))
            toast.success(res.data.pinned ? "Note pinned" : "Note unpinned")
        } catch (error) {
            console.log("error in handleTogglePin", error)
            toast.error("There was an error updating the pin")
        }
    }

    const imageUrl = resolveImageUrl(note.imageUrl)

    return <div
        className="card bg-base-100 border border-base-300 border-t-4 border-t-primary hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
        <div className="card-body">
            {imageUrl && (
                <Link to={`/note/${note._id}`} className="block">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-base-200 p-2">
                        <img
                            src={imageUrl}
                            alt={note.title}
                            className="h-full w-full object-contain"
                            loading="lazy"
                        />
                    </div>
                </Link>
            )}
            <Link to={`/note/${note._id}`} className="space-y-2">
                <div className="flex items-center gap-2">
                    <h3 className="card-title text-base-content">{note.title}</h3>
                    {note.pinned && (
                        <span className="badge badge-primary badge-sm">Pinned</span>
                    )}
                </div>
                {note.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag) => (
                            <span key={tag} className="badge badge-outline badge-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <div className="text-base-content/70 line-clamp-3">
                    <ReactMarkdown
                        {...markdownPlugins}
                        components={{
                            p: ({ children }) => <span>{children}</span>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            u: ({ children }) => <u className="underline">{children}</u>,
                        }}
                    >
                        {note.content || ""}
                    </ReactMarkdown>
                </div>
            </Link>
            <div className="card-actions justify-between items-center mt-4">
                <span className="text-sm text-base-content/60">
                    {formatDate(new Date(note.createdAt))}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        className={`btn btn-ghost btn-xs ${note.pinned ? "text-primary" : ""}`}
                        onClick={handleTogglePin}
                        aria-label={note.pinned ? "Unpin note" : "Pin note"}
                    >
                        <PinIcon className="size-4" />
                    </button>
                    <button
                        className="btn btn-ghost btn-xs"
                        onClick={handleEdit}
                        aria-label="Edit note"
                    >
                        <PenSquareIcon className="size-4" />
                    </button>
                    <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleDelete(note._id)}
                        aria-label="Delete note"
                    >
                        <Trash2Icon className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
}
export default NoteCard;