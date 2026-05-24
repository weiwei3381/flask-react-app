import React, { useState } from 'react'
import { InboxOutlined } from '@ant-design/icons'
import { Button, message, Upload } from 'antd'
import type { UploadProps } from 'antd'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import PDFThumbnailSelector from '../../components/PDFThumbnailSelector'
import { BASE_URL, fetchFile } from '../../../utils/network'

const PdfToolPage: React.FC = () => {
  const [selectedPages, setSelectedPages] = useState<number[]>([]) // 存储被选中的页码数组
  const [pdfFileUrl, setPdfFileUrl] = useState('')
  const [filename, setFilename] = useState('')

  // 处理抽取文件按钮
  const handleExtractPdf = async () => {
    console.log(selectedPages)
    message.info(`filename: ${filename}, selectedPages:${selectedPages}`)
    await fetchFile(
      '/api/v1/pdf/extract',
      {
        filename: filename,
        pageNumbers: selectedPages,
      },
      'extract.pdf'
    )
  }

  const { Dragger } = Upload

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf',
    action: BASE_URL + '/api/v1/upload',
    // 开始上传前的钩子函数, 可以用来验证文件类型等
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf'
      message.info(`file.type: ${file.type} `)
      if (!isPDF) {
        message.error(`${file.name} is not a pdf file`)
      }
      return isPDF || Upload.LIST_IGNORE
    },
    // 上传栏变化的回调函数
    onChange(info) {
      const { file } = info
      const { status } = file
      if (status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`)
        const response = file.response
        if (response?.data?.filename) {
          setFilename(response?.data?.filename)
          setPdfFileUrl(`${BASE_URL}/uploads/${response?.data?.filename}`)
          message.info(response?.data?.filename, 10)
        }
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
  }

  return (
    <div style={{ padding: '50px' }}>
      <h2>PDF工具</h2>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖动文件到此区域进行上传</p>
        <p className="ant-upload-hint">支持单个或批量上传。请确保上传的文件格式正确。</p>
      </Dragger>
      <PDFThumbnailSelector selectPagesCallback={setSelectedPages} pdfUrl={pdfFileUrl} />
      <br />
      <Button onClick={handleExtractPdf} disabled={selectedPages.length === 0}>
        抽取页面
      </Button>
    </div>
  )
}

export default PdfToolPage
