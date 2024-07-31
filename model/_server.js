import mongoose from "mongoose";

export const ServerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    version: {
        type: String,
        required: true,
    },

    core: {
        type: String,
        required: true,
    },

    path: {
        type: String,
    }
})

