import mongoose from "mongoose";

//1: create a schema
//2: model based off of that schem

const revisionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            default: null
        },
        tags: {
            type: [String],
            default: []
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: true }
)

const noteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            default: null
        },
        tags: {
            type: [String],
            default: []
        },
        pinned: {
            type: Boolean,
            default: false
        },
        pinnedAt: {
            type: Date,
            default: null
        },
        revisions: {
            type: [revisionSchema],
            default: []
        }
    },
    { timestamps: true } //createdAt, updatedAt
);

const Note = mongoose.model("Note", noteSchema)

export default Note