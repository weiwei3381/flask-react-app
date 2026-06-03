import React from 'react'
import { createHashRouter } from 'react-router-dom'
import App from '../App'
import ArticlePage from '../renderer/pages/articlePage'
import LoginPage from '../renderer/pages/loginPage'
import AuthGuard from '../renderer/auth/AuthGuard'

const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
  },
  {
    path: '/article/:paraId',
    element: (
      <AuthGuard>
        <ArticlePage />
      </AuthGuard>
    ),
  },
])

export default router
