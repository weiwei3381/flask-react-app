/* eslint-disable no-restricted-syntax */
/**
 * 词云图
 */
import stopWords from '../../utils/stopwords'
import React, { useEffect, useState } from 'react'
import { Cloud, renderSimpleIcon } from 'react-icon-cloud'

interface WordCloudProp {
  contentList: string[] // 内容列表, 每个内容单独成行
  maxFontSize: number // 词云图的最大字号
  minFontSize: number // 词云图的最小字号
}

const MyWordCloud: React.FC<WordCloudProp> = ({
  contentList,
  maxFontSize,
  minFontSize,
}) => {
  const [tagData, setTagData] = useState([])
  const [extremesValue, setExtremesValue] = useState({
    maxValue: 1,
    minValue: 0,
  })

  useEffect(() => {
    if (contentList && contentList.length > 0) {
      const wordCount: Map<string, number> = new Map() // 计数的词
      for (let i = 0; i < contentList.length; i += 1) {
        const wordList = contentList[i]
        for (const word of wordList) {
          if (wordCount.has(word)) {
            const originCount = wordCount.get(word)
            wordCount.set(word, originCount + 1)
          } else {
            wordCount.set(word, 1)
          }
        }
      }
      const wordCountList = Array.from(wordCount)
      const sortedWordList = wordCountList.sort((a, b) => b[1] - a[1]) // 排序后的值
      const stopWordList = stopWords
      const filteredWords = sortedWordList.filter(
        (item) => !stopWordList.includes(item[0]) && item[0].length >= 2
      )
      if (filteredWords && filteredWords.length > 0) {
        const myTagData = filteredWords.map((item) => {
          return {
            text: item[0],
            value: item[1],
          }
        })
        const slicedData = myTagData.slice(0, 100)
        setTagData(slicedData)
        setExtremesValue({
          maxValue: slicedData[0].value,
          minValue: slicedData[slicedData.length - 1].value,
        }) // 设置极端数值
      }
    }
  }, [contentList])

  return (
    <Cloud>
      {tagData.map((tag) => (
        <a>`${tag.text}`</a>
      ))}
    </Cloud>
  )
}

export default MyWordCloud
