import express from 'express'
import 'dotenv/config';

const app = express()

app.use(express.json());

app.get('/health',(req,res) => {
    res.json({
        status:'health check'
    })
})

const PORT = 3000

app.listen(PORT,() => {
    console.log(`server is running on port ${PORT}`)
})