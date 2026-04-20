import React from 'react'
import { Tooltip } from 'antd'

interface ColorDivProp {
  colorIndex: number // 颜色序号
  contentList: string[] // 内容列表, 每个内容单独成行
  link: string | null // 打开链接
}

// 彩色内容的DIV元素, 其中传入不同的序号得到的颜色是一样的
const ColorDiv: React.FC<ColorDivProp> = ({
  colorIndex,
  contentList,
  link,
}) => {
  const colorList = [
    '#d0ebff',
    '#c3fae8',
    '#e9fac8',
    '#ffe8cc',
    '#e5dbff',
    '#ffdeeb',
    '#fff3bf',
    '#d3f9d8',
    '#c5f6fa',
    '#f3d9fa',
  ] // 颜色列表

  const index = colorIndex % colorList.length // 求余数
  const cursor = link ? 'pointer' : 'default'
  const tipTitle = link ? '双击打开原文件' : ''

  return (
    <Tooltip title={tipTitle}>
      <div
        style={{
          fontSize: '0.8em',
          color: '#000',
          textAlign: 'center',
          lineHeight: '1.2em',
          background: colorList[index],
          border: '1px solid #adb5bd',
          borderRadius: '8px',
        }}
      >
        {contentList.map((content, i) => (
          <div style={{ cursor }} key={i}>
            {content}
          </div>
        ))}
      </div>
    </Tooltip>
  )
}

export default ColorDiv
