/**
 * LocalStorage 操作封装类
 * 提供类型安全的增删查改方法
 */

export type LocalNameSpaceKeys =
  | 'fullTextPage'
  | 'documentPage'
  | 'structurePage'
  | 'welcomePage' // 定义命名空间类型
export type LocalStorageKeys =
  | 'searchHistory'
  | 'documentTotal'
  | 'structureTotal'
  | 'paragraphTotal'
  | 'searchCount' // 搜索次数
  | 'searchHistoryValues' // 搜索历史的具体值
  | 'searchDateAndCount' // 搜索日期和次数的记录

class LocalStorageManager {
  /**
   * 存储数据到 localStorage
   * @param key 存储的键名
   * @param value 要存储的值，会被 JSON.stringify 序列化
   * @returns 操作是否成功
   */
  static setItem<T>(key: LocalStorageKeys, value: T): boolean {
    try {
      const serializedValue = JSON.stringify(value)
      window.localStorage.setItem(key, serializedValue)
      return true
    } catch (error) {
      console.error(`Error setting item "${key}" to localStorage:`, error)
      return false
    }
  }

  /**
   * 存储数据到 localStorage 指定的命名空间下
   * @param nameSpace 命名空间，用于区分不同模块的数据存储
   * @param key 在命名空间下存储的键名
   * @param value 要存储的值
   * @returns 操作是否成功
   */
  static setNameSpaceItem<T>(
    nameSpace: LocalNameSpaceKeys,
    key: LocalStorageKeys,
    value: T
  ): boolean {
    try {
      const storage = JSON.parse(window.localStorage.getItem(nameSpace) || '{}')
      storage[key] = value
      window.localStorage.setItem(nameSpace, JSON.stringify(storage))
    } catch (error) {
      console.error(`Error adding item "${key}" to localStorage:`, error)
      return false
    }
  }

  /**
   * 获取 localStorage 中指定命名空间下的数据
   * @param nameSpace 命名空间，用于区分不同模块的数据存储
   * @param key 在命名空间下存储的键名
   * @param defaultValue 默认值，如果键不存在或解析失败时返回
   * @returns 返回命名空间下指定键的值，如果不存在则返回 defaultValue
   */
  static getNameSpaceItem<T>(
    nameSpace: LocalNameSpaceKeys,
    key: LocalStorageKeys,
    defaultValue: T | null = null
  ): T | null {
    try {
      const storage = JSON.parse(window.localStorage.getItem(nameSpace) || '{}')
      return storage[key] !== undefined ? (storage[key] as T) : defaultValue
    } catch (error) {
      console.error(`Error getting item "${key}" from localStorage:`, error)
      return defaultValue
    }
  }

  /**
   * 从 localStorage 获取数据
   * @param key 要获取的键名
   * @param defaultValue 如果键不存在或解析失败时的默认值
   * @returns 解析后的数据，如果不存在则返回 defaultValue
   */
  static getItem<T>(
    key: LocalStorageKeys,
    defaultValue: T | null = null
  ): T | null {
    try {
      const storedValue = window.localStorage.getItem(key)
      if (storedValue === null) {
        return defaultValue
      }
      // 使用范型 T 来解析 JSON 数据
      return JSON.parse(storedValue) as T
    } catch (error) {
      console.error(`Error getting item "${key}" from localStorage:`, error)
      return defaultValue
    }
  }

  /**
   * 从 localStorage 删除数据
   * @param key 要删除的键名
   * @returns 操作是否成功
   */
  static removeItem(key: LocalStorageKeys): boolean {
    try {
      window.localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing item "${key}" from localStorage:`, error)
      return false
    }
  }

  /**
   * 清空所有 localStorage 数据
   * @returns 操作是否成功
   */
  static clear(): boolean {
    try {
      window.localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  /**
   * 检查某个键是否存在
   * @param key 要检查的键名
   * @returns 键是否存在
   */
  static hasKey(key: LocalStorageKeys): boolean {
    return window.localStorage.getItem(key) !== null
  }

  /**
   * 增加搜索次数，每次调用时会将 welcomePage 命名空间下的 searchCount 键的值加 1
   */
  static addSearchCount() {
    const currentCount = this.getNameSpaceItem('welcomePage', 'searchCount', 0)
    this.setNameSpaceItem('welcomePage', 'searchCount', currentCount + 1)
  }
}

export default LocalStorageManager
