import mongoose from "mongoose";

const ServerSchema = new mongoose.Schema({
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

export default mongoose.model('Server', ServerSchema)
