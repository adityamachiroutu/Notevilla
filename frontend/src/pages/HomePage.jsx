import { useState, useEffect } from "react"
import { Link } from "react-router"
import NavBar from "../Components/Navbar.jsx"
import RateLimitedUI from "../Components/RateLimitedUI.jsx"
import NoteCard from "../Components/NoteCard.jsx"
import toast from "react-hot-toast"
import axiosInstance from "../lib/axios.js";

const HomePage = () => {
    const [isRateLimited, setIsRateLimited] = useState(false);

    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [dateSort, setDateSort] = useState("newest")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedTag, setSelectedTag] = useState("")

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await axiosInstance.get("/notes")
                setNotes(res.data)
                setIsRateLimited(false)
            } catch (error) {
                console.log(error)
                if (error.response && error.response.status === 429) {
                    setIsRateLimited(true)
                }
                else {
                    toast.error("Failed to load notes")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchNotes()
    }, [])


    const normalizedTerm = searchTerm.trim().toLowerCase()
    const inDateRange = (createdAt) => {
        if (!startDate && !endDate) return true
        const noteDate = new Date(createdAt)
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null

        if (start && noteDate < start) return false
        if (end && noteDate > end) return false
        return true
    }

    const allTags = Array.from(
        new Set(notes.flatMap((note) => note.tags || []))
    ).sort((a, b) => a.localeCompare(b))

    const matchesTag = (note) => {
        if (!selectedTag) return true
        return (note.tags || []).includes(selectedTag)
    }

    const filteredNotes = normalizedTerm
        ? notes.filter((note) => {
            const title = note.title?.toLowerCase() || ""
            const content = note.content?.toLowerCase() || ""
            const tags = (note.tags || []).join(" ").toLowerCase()
            const matchesText =
                title.includes(normalizedTerm) ||
                content.includes(normalizedTerm) ||
                tags.includes(normalizedTerm)
            return matchesText && inDateRange(note.createdAt) && matchesTag(note)
        })
        : notes.filter((note) => inDateRange(note.createdAt) && matchesTag(note))

    const sortedNotes = [...filteredNotes].sort((a, b) => {
        const aPinned = Boolean(a.pinned)
        const bPinned = Boolean(b.pinned)

        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1

        if (aPinned && bPinned) {
            const aPinnedAt = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
            const bPinnedAt = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
            if (aPinnedAt !== bPinnedAt) return bPinnedAt - aPinnedAt
        }

        const aDate = new Date(a.createdAt).getTime()
        const bDate = new Date(b.createdAt).getTime()
        return dateSort === "oldest" ? aDate - bDate : bDate - aDate
    })

    return (
        <div className="min-h-screen bg-base-200">
            <NavBar />
            {isRateLimited && <RateLimitedUI />}

            <div className="max-w-7xl mx-auto p-4 mt-6">
                {loading && <div className="text-center text-primary py-10">Loading data...</div>}

                {!loading && !isRateLimited && notes.length === 0 && (
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body items-center text-center gap-3">
                            <h2 className="card-title text-2xl">No notes yet</h2>
                            <p className="text-base-content/70">
                                Create your first note to start capturing ideas.
                            </p>
                            <Link to="/create" className="btn btn-primary">
                                Create your first note
                            </Link>
                        </div>
                    </div>
                )}

                {!loading && !isRateLimited && notes.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                        <div className="grid gap-3 lg:grid-cols-[2.5fr,1.2fr,1.8fr,1fr,auto] lg:items-end">
                            <label className="input input-bordered flex items-center gap-2 w-full">
                                <input
                                    type="text"
                                    className="grow"
                                    placeholder="Search notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        Clear
                                    </button>
                                )}
                            </label>

                            <label className="form-control w-full">
                                <span className="text-xs text-base-content/60 mb-1">Tag</span>
                                <select
                                    className="select select-bordered"
                                    value={selectedTag}
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                >
                                    <option value="">All tags</option>
                                    {allTags.map((tag) => (
                                        <option key={tag} value={tag}>
                                            {tag}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-base-content/60">Date range</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="input input-bordered"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="input input-bordered"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    {(startDate || endDate) && (
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => {
                                                setStartDate("")
                                                setEndDate("")
                                            }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            <label className="form-control w-full">
                                <span className="text-xs text-base-content/60 mb-1">Sort</span>
                                <select
                                    className="select select-bordered"
                                    value={dateSort}
                                    onChange={(e) => setDateSort(e.target.value)}
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                </select>
                            </label>

                            <div className="text-sm text-base-content/60 lg:text-right">
                                {filteredNotes.length} of {notes.length}
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !isRateLimited && notes.length > 0 && filteredNotes.length === 0 && (
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body items-center text-center gap-3">
                            <h2 className="card-title text-2xl">No matches found</h2>
                            <p className="text-base-content/70">
                                Try a different keyword or clear the search.
                            </p>
                            <button className="btn btn-ghost" onClick={() => setSearchTerm("")}
                                type="button">
                                Clear search
                            </button>
                        </div>
                    </div>
                )}

                {sortedNotes.length > 0 && !isRateLimited && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedNotes.map(note => (
                            <NoteCard key={note._id} note={note} setNotes={setNotes} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;