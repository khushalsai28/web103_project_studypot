import { Router } from 'express'

const apiRouter = Router()

apiRouter.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    message: 'StudyPot API is running',
  })
})

export default apiRouter
