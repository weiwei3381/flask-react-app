import React, { useState } from 'react'
import {
  InboxOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { Button, Card, message, Space, Tabs, Upload } from 'antd'
import type { UploadProps } from 'antd'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import PDFThumbnailSelector from '../../components/PDFThumbnailSelector'
import { BASE_URL, fetchFile } from '../../../utils/network'
import './PdfToolPage.css'

const { Dragger } = Upload

const PdfToolPage: React.FC = () => {
  // ==================== PDF操作相关状态 ====================
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [numPages, setNumPages] = useState(0)
  const [pdfInfo, setPdfInfo] = useState<{ name: string; filename: string } | null>(null)

  // ==================== 图片转PDF相关状态 ====================
  const [imageFiles, setImageFiles] = useState<{ uid: string; name: string; filename: string }[]>(
    []
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ==================== PDF操作处理函数 ====================

  // 处理抽取PDF页面
  const handleExtractPdf = async () => {
    if (!pdfInfo) return
    await fetchFile(
      '/api/v1/pdf/extract',
      { filename: pdfInfo.filename, pageNumbers: selectedPages },
      'extract.pdf'
    )
  }

  // 处理PDF页面转为图片ZIP下载
  const handleExtractImages = async () => {
    if (!pdfInfo) return
    await fetchFile(
      '/api/v1/pdf/extract-images',
      { filename: pdfInfo.filename, pageNumbers: selectedPages },
      'images.zip'
    )
  }

  // 在选中页面之前或之后插入空白页，生成新PDF直接下载
  const handleInsertBlankPage = async (position: 'before' | 'after') => {
    if (!pdfInfo || selectedPages.length !== 1) return
    const pageNumber = selectedPages[0]
    await fetchFile(
      '/api/v1/pdf/insert-blank',
      {
        filename: pdfInfo.filename,
        pageNumber,
        position,
      },
      `blank_insert_${position}_p${pageNumber}.pdf`
    )
  }

  // 全选所有页面
  const handleSelectAll = () => {
    if (numPages > 0) {
      setSelectedPages(Array.from({ length: numPages }, (_, i) => i + 1))
    }
  }

  // 取消全选
  const handleDeselectAll = () => {
    setSelectedPages([])
  }

  // ==================== 图片转PDF处理函数 ====================

  // 处理图片合并为PDF
  const handleMergeImages = async () => {
    if (imageFiles.length === 0) {
      message.warning('请先上传图片')
      return
    }
    const filenames = imageFiles.map((f) => f.filename)
    await fetchFile('/api/v1/pdf/merge-images', { filenames }, 'merged_images.pdf')
  }

  // 移除单张已上传的图片
  const handleRemoveImage = (uid: string) => {
    setImageFiles((prev) => prev.filter((f) => f.uid !== uid))
  }

  // ==================== 图片拖拽排序处理函数 ====================

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    // 重新排列图片顺序
    setImageFiles((prev) => {
      const newList = [...prev]
      const [draggedItem] = newList.splice(dragIndex, 1)
      newList.splice(index, 0, draggedItem)
      return newList
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  // ==================== PDF上传配置 ====================
  const pdfUploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf',
    action: BASE_URL + '/api/v1/upload',
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf'
      if (!isPDF) {
        message.error(`${file.name} 不是PDF文件`)
      }
      return isPDF || Upload.LIST_IGNORE
    },
    onChange(info) {
      const { file } = info
      if (file.status === 'done') {
        message.success(`${file.name} 上传成功`)
        const response = file.response
        if (response?.data?.filename) {
          // 只保留最新上传的一个PDF，自动进行预览
          setPdfInfo({
            name: file.name,
            filename: response.data.filename,
          })
          setSelectedPages([])
        }
      } else if (file.status === 'error') {
        message.error(`${file.name} 上传失败`)
      }
    },
  }

  // ==================== 图片上传配置 ====================
  const imageUploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    action: BASE_URL + '/api/v1/upload',
    showUploadList: false, // 不使用组件自带列表，改为自定义预览
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error(`${file.name} 不是图片文件`)
      }
      return isImage || Upload.LIST_IGNORE
    },
    onChange(info) {
      const { fileList: currentFileList } = info
      // 从当前文件列表中提取已上传成功的文件信息
      const doneFiles = currentFileList
        .filter((f) => f.status === 'done' && f.response?.data?.filename)
        .map((f) => ({
          uid: f.uid,
          name: f.name,
          filename: f.response.data.filename,
        }))
      // 按上传顺序保持排列
      setImageFiles(doneFiles)
    },
  }

  // ==================== Tab配置 ====================
  const tabItems = [
    {
      key: 'pdf',
      label: (
        <span>
          <FilePdfOutlined /> PDF页面抽取
        </span>
      ),
      children: (
        <div className="pdf-tool-section">
          <Card title="上传PDF文件" size="small" style={{ marginBottom: 16 }}>
            <Dragger {...pdfUploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖动PDF文件到此区域上传</p>
              <p className="ant-upload-hint">仅支持单个PDF文件，新上传会替换旧文件</p>
            </Dragger>
          </Card>

          {/* 显示当前PDF文件名 */}
          {pdfInfo && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div className="pdf-current-file">
                <FilePdfOutlined className="pdf-file-icon" />
                <span className="pdf-file-name" title={pdfInfo.name}>
                  当前文件：{pdfInfo.name}
                </span>
              </div>
            </Card>
          )}

          {/* 预览当前PDF的缩略图 */}
          {pdfInfo && (
            <Card
              title="选择要操作的页面（点击选中/取消）"
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Space size="small">
                  <Button size="small" onClick={handleSelectAll}>
                    全选
                  </Button>
                  <Button size="small" onClick={handleDeselectAll}>
                    取消全选
                  </Button>
                </Space>
              }
            >
              <PDFThumbnailSelector
                selectedPages={selectedPages}
                onSelectionChange={setSelectedPages}
                onNumPagesChange={setNumPages}
                pdfUrl={`${BASE_URL}/uploads/${pdfInfo.filename}`}
              />
            </Card>
          )}

          <Space>
            <Button
              type="primary"
              onClick={handleExtractPdf}
              disabled={!pdfInfo || selectedPages.length === 0}
            >
              抽取选中页面为PDF
            </Button>
            <Button onClick={handleExtractImages} disabled={!pdfInfo || selectedPages.length === 0}>
              选中页面转为图片ZIP
            </Button>
            {selectedPages.length === 1 && (
              <>
                <Button onClick={() => handleInsertBlankPage('before')}>
                  在选中页前插入空白页
                </Button>
                <Button onClick={() => handleInsertBlankPage('after')}>在选中页后插入空白页</Button>
              </>
            )}
          </Space>
        </div>
      ),
    },
    {
      key: 'image',
      label: (
        <span>
          <FileImageOutlined /> 图片合并为PDF
        </span>
      ),
      children: (
        <div className="image-tool-section">
          <Card title="上传图片（支持多选）" size="small" style={{ marginBottom: 16 }}>
            <Dragger {...imageUploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖动图片文件到此区域上传</p>
              <p className="ant-upload-hint">支持JPG、PNG等常见图片格式，可批量上传</p>
            </Dragger>
          </Card>

          {/* 图片预览区 */}
          {imageFiles.length > 0 && (
            <Card
              title={`已上传 ${imageFiles.length} 张图片（拖动可调整顺序）`}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <div className="image-preview-grid">
                {imageFiles.map((file, index) => (
                  <div
                    key={file.uid}
                    className={`image-preview-item ${dragIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="image-preview-index">{index + 1}</div>
                    <img
                      src={`${BASE_URL}/uploads/${file.filename}`}
                      alt={file.name}
                      className="image-preview-img"
                    />
                    <div className="image-preview-name" title={file.name}>
                      {file.name}
                    </div>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      className="image-preview-remove"
                      onClick={() => handleRemoveImage(file.uid)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Button type="primary" onClick={handleMergeImages} disabled={imageFiles.length === 0}>
            合并为PDF下载
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="pdf-tool-page">
      <h2>PDF工具</h2>
      <Tabs defaultActiveKey="pdf" items={tabItems} />
    </div>
  )
}

export default PdfToolPage
