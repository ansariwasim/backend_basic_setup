
import mongoose from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new mongoose.Schema({

    videoFile: {
        type: String, // cloudnary url
        required: true
    },
    thumbnail: {
        type: String,  // cloudnary url
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    duration:{
        type: Number,  // cloudanry url
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    inPublished: {
        type: Boolean,
        default: true
    }

}, {timestamps: true})


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.Model("Video", videoSchema)