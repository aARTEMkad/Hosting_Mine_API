import express, { json } from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
// ----
import ServerRouter from './router/ServerRouter.js';

dotenv.config()

const app = express();

const PORTAPI = process.env.PORT || 3001



mongoose.connect(process.env.URLMDB)
.then(() => {
    console.log("Connected MongoDB");
})
.catch((err) => {
    console.log(`Error = ${err}`);
});


app.listen(PORTAPI, () => {

    app.use(express.json())

    app.use(ServerRouter);
    console.log(`Start API on port = "${PORTAPI}"`);
})