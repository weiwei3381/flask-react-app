// 自定义hooks

import { useState, useEffect } from 'react'

/**
 * useDebounce是一个自定义的React Hook，用于实现防抖功能。当输入值发生变化时，它会等待指定的时间（delay）后才更新返回的值。如果在等待期间输入值再次发生变化，之前的等待将被取消，并重新开始等待。这对于减少频繁更新或请求的情况非常有用，例如搜索输入框中的实时搜索建议。
 * @param value 需要防抖的值
 * @param delay 防抖的时间，单位为毫秒
 * @returns 防抖后的值
 */
export const useDebounce = <T,>(value: T, delay: number) => {
  const [debounceValue, setDebounceValue] = useState(value)

  useEffect(() => {
    // 每次在value变化以后，设置一个定时器
    const timeout = setTimeout(() => setDebounceValue(value), delay)
    // 上一个useEffect处理完后清理
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounceValue
}

/**
 * useTitle是一个自定义的React Hook，用于在组件挂载时设置页面标题，并在组件卸载时恢复原来的标题。
 * @param title 设置页面标题的hook
 */
export const useTitle = (title: string) => {
  useEffect(() => {
    // 保存原来的标题，以便组件卸载时恢复
    const originalTitle = document.title
    document.title = title

    return () => {
      document.title = originalTitle
    }
  }, [title])
}

