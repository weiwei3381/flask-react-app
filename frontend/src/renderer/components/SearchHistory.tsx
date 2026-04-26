/**
 * 搜索的历史记录组件
 */

import React, { useEffect, useState } from 'react'
import { Row, Button } from 'antd'
import { DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import './searchHistory.css'
import { searchTrim } from '../../utils'
import type { LocalNameSpaceKeys } from '../../utils/localStorage'
import LocalStorageManager from '../../utils/localStorage'

interface SearchHistoryProp {
  historyType: LocalNameSpaceKeys
  onClickValue: (value: string) => void // 点击某个历史记录的回调函数
  searchValue: string // 搜索词
  maxLength?: number // 最长保存记录
}

const SearchHistory: React.FC<SearchHistoryProp> = ({
  historyType,
  onClickValue,
  searchValue,
  maxLength = 19,
}) => {
  const [searchHistory, setSearchHistory] = useState(
    LocalStorageManager.getNameSpaceItem(historyType, 'searchHistory', [])
  ) // 获得搜索历史
  const [moreHistory, setMoreHistory] = useState(false) // 是否显示更多历史

  useEffect(() => {
    const updateHistory = () => {
      if (!searchValue || searchTrim(searchValue).length === 0) {
        return
      }
      const value = searchTrim(searchValue)
      let newHistory = [...searchHistory] // 获取搜索历史
      // 如果搜索历史太长,则排除掉前面的
      if (newHistory.length > maxLength) {
        // 将前几项排除掉
        newHistory = newHistory.slice(
          newHistory.length - maxLength,
          newHistory.length
        )
      }
      // 如果搜索历史是空，或者搜索历史中不包含搜索词，则将现有搜索词加入搜索历史
      if (newHistory.length === 0 || !newHistory.includes(value)) {
        // 将最新搜索加入搜索历史
        newHistory.push(value)
        setSearchHistory(newHistory)
        LocalStorageManager.setNameSpaceItem(
          historyType,
          'searchHistory',
          newHistory
        ) // 保存搜索历史
      }
    }
    updateHistory()
  }, [searchValue, historyType, maxLength, searchHistory])

  return (
    <Row style={{ marginBottom: '12px' }} className="search-history">
      <Button type="text" size="small" style={{ cursor: 'default' }}>
        搜索历史：
      </Button>
      {moreHistory
        ? [...searchHistory].reverse().map((value) => (
            <Button
              type="default"
              shape="round"
              size="small"
              style={{ marginRight: '6px' }}
              onClick={async () => {
                onClickValue(value)
              }}
            >
              {value}
            </Button>
          ))
        : [...searchHistory]
            .reverse()
            .slice(0, 5)
            .map((value) => (
              <Button
                type="default"
                shape="round"
                size="small"
                style={{ marginRight: '6px' }}
                onClick={async () => {
                  onClickValue(value)
                }}
              >
                {value}
              </Button>
            ))}
      {searchHistory.length > 5 && (
        <Button
          className="expand-toggle"
          size="small"
          type="link"
          icon={moreHistory ? <UpOutlined /> : <DownOutlined />}
          onClick={() => {
            if (moreHistory) {
              setMoreHistory(false)
            } else {
              setMoreHistory(true)
            }
          }}
        >
          {moreHistory ? '收起' : '展开'}
        </Button>
      )}
      {searchHistory.length > 0 && (
        <Button
          className="search-clear-btn"
          size="small"
          type="link"
          icon={<DeleteOutlined />}
          onClick={() => {
            setSearchHistory([])
            console.log('清空')

            LocalStorageManager.setNameSpaceItem(
              historyType,
              'searchHistory',
              []
            )
          }}
        >
          清空
        </Button>
      )}
    </Row>
  )
}

export default SearchHistory
