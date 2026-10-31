import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import apiRouter from './routes/api.js'

const app = express()
const port = process.env.PORT || 3000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: clientOrigin }))
app.use(express.json())
app.use('/api', apiRouter)
app.use((error, _request, response, _next) => {
  console.error('Unhandled API error:', error)
  response.status(500).json({ error: 'An unexpected server error occurred' })
})

app.listen(port, () => {
  console.log(`StudyPot API listening on http://localhost:${port}`)
})
