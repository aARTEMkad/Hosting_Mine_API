import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

const PORTAPI = process.env.PORT || 3001


app.listen(PORTAPI, () => {
    console.log(`Start API on port = "${PORTAPI}"`);
})