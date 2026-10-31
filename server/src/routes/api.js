import { Router } from 'express'
import pool from '../db/pool.js'
import { createSessionsRouter } from './sessions.js'

const apiRouter = Router()

apiRouter.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    message: 'StudyPot API is running',
  })
})

apiRouter.use('/sessions', createSessionsRouter(pool))

export default apiRouter
