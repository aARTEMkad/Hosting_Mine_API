import mongoose from "mongoose";


const ServerSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
    },

    memory: {
        type: Number,
        required: true,
    },

    cpus: {
        type: Number,
        required: true,
    },

    ports: {
        type: String,
        required: true,
    },

    core: {
        type: String,
        required: true,
    },

    version: {
        type: String,
        required: true,
    },

    javaVersion: {
        type: String,
        required: true,
    },

    containerId: {
        type: String,
        required: true,
    }
})

export default mongoose.model('Server', ServerSchema)
