import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
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
    console.log(`Start API on port = "${PORTAPI}"`);
})