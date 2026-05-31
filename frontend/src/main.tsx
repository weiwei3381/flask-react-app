import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from './router/index.tsx'
// 解决旧版浏览器URL.parse, Promise.withResolvers不存在, 使用core-js包并引入对应的polyfill
import 'core-js/actual/url/parse'  
import 'core-js/actual/promise/with-resolvers'  

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
