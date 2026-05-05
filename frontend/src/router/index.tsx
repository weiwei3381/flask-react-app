import { createHashRouter } from 'react-router-dom'
import App from '../App'
import ArticlePage from '../renderer/pages/articlePage'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/article/:paraId',
    element: <ArticlePage />,
  },
])

export default router
