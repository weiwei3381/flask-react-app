// 自定义hooks

import { useState, useEffect } from 'react'

const useDebounce = <T,>(value: T, delay: number) => {
  const [debounceValue, setDebounceValue] = useState(value)

  useEffect(() => {
    // 每次在value变化以后，设置一个定时器
    const timeout = setTimeout(() => setDebounceValue(value), delay)
    // 上一个useEffect处理完后清理
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounceValue
}

export default useDebounce
