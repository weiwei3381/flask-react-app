import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import './PDFThumbnailSelector.css' // 引入自定义样式

// 自定义Prop类型
interface PDFThumbnailSelectorProps {
  pdfUrl: string // PDF文件的URL
  selectedPages: number[] // 由父组件控制的已选页码数组，顺序即为导出顺序
  onSelectionChange: (pages: number[]) => void // 选中页码变化时的回调
  onNumPagesChange: (numPages: number) => void // PDF总页数变化时的回调
}

// 设置 PDF.js Worker，防止出现渲染报错
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PDFThumbnailSelector = ({
  pdfUrl,
  selectedPages,
  onSelectionChange,
  onNumPagesChange,
}: PDFThumbnailSelectorProps) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [tagDragIndex, setTagDragIndex] = useState<number | null>(null)

  // PDF 加载成功后的回调
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    onNumPagesChange(numPages)
  }

  // 处理缩略图的点击选中/取消（追加到末尾保持点击顺序）
  const toggleSelectPage = (pageNum: number) => {
    if (selectedPages.includes(pageNum)) {
      onSelectionChange(selectedPages.filter((p) => p !== pageNum))
    } else {
      onSelectionChange([...selectedPages, pageNum])
    }
  }

  // 获取某个页面在选中列表中的顺序位置（1-indexed），未选中返回 0
  const getOrderIndex = (pageNum: number): number => {
    const idx = selectedPages.indexOf(pageNum)
    return idx === -1 ? 0 : idx + 1
  }

  // 移除某个选中的页码
  const handleRemoveTag = (pageNum: number) => {
    onSelectionChange(selectedPages.filter((p) => p !== pageNum))
  }

  // ==================== 标签拖拽排序 ====================

  const handleTagDragStart = (index: number) => {
    setTagDragIndex(index)
  }

  const handleTagDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (tagDragIndex === null || tagDragIndex === index) return
    const newList = [...selectedPages]
    const [draggedItem] = newList.splice(tagDragIndex, 1)
    newList.splice(index, 0, draggedItem)
    onSelectionChange(newList)
    setTagDragIndex(index)
  }

  const handleTagDragEnd = () => {
    setTagDragIndex(null)
  }

  return (
    <div>
      <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
        {/* 选中页码标签栏 */}
        {selectedPages.length > 0 && (
          <div className="selection-tags-bar">
            <span className="selection-count">{selectedPages.length}</span>
            <span className="selection-label">页已选中（拖动调整导出顺序）</span>
            <div className="selection-tags">
              {selectedPages.map((pageNum, index) => (
                <span
                  key={pageNum}
                  className={`selection-tag ${tagDragIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleTagDragStart(index)}
                  onDragOver={(e) => handleTagDragOver(e, index)}
                  onDragEnd={handleTagDragEnd}
                >
                  <span className="tag-page">{pageNum}</span>
                  <span className="tag-remove" onClick={(e) => { e.stopPropagation(); handleRemoveTag(pageNum) }}>&times;</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 缩略图容器 */}
        <div className="thumbnail-container">
          {Array.from(new Array(numPages), (_el, index) => (
            <div
              key={`page_${index + 1}`}
              className={`thumbnail-item ${selectedPages.includes(index + 1) ? 'selected' : ''}`}
              onClick={() => toggleSelectPage(index + 1)}
            >
              {/* 导出顺序角标 */}
              {getOrderIndex(index + 1) > 0 && (
                <span className="thumbnail-order-badge">{getOrderIndex(index + 1)}</span>
              )}
              <Page pageNumber={index + 1} width={180} />
              <span>第 {index + 1} 页</span>
            </div>
          ))}
        </div>
      </Document>
    </div>
  )
}

export default PDFThumbnailSelector
