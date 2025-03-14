import express from 'express'

const app = express()

const PORT = process.env.PORT ?? 4321

app.listen(PORT,()=>{
    console.log(`Server on port ${PORT}`);
    
})