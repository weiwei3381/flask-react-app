import React from 'react'
import { Tooltip } from 'antd'

interface ColorDivProp {
  colorIndex: number // 颜色序号
  contentList: string[] // 内容列表, 每个内容单独成行
  url: string | null // 新窗口链接
}

// 彩色内容的DIV元素, 其中传入不同的序号得到的颜色是一样的
const ColorDiv: React.FC<ColorDivProp> = ({ colorIndex, contentList, url }) => {
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
  const cursor = url ? 'pointer' : 'default'
  const tipTitle = url ? '双击新窗口打开' : ''

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
          <div
            style={{ cursor }}
            key={i} // 为了不影响性能，只在双击时才检测文件是否存在
            onDoubleClick={(evt) => {
              evt.stopPropagation() // 如果传入链接, 则阻止冒泡，否则会访问父元素方法导致打开详情页
              // 可以打开内部路由
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
          >
            {content}
          </div>
        ))}
      </div>
    </Tooltip>
  )
}

export default ColorDiv
