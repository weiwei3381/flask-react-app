import React, { useState } from 'react'
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import type { UploadProps } from 'antd';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import PDFThumbnailSelector from '../../components/PDFThumbnailSelector';


const PdfToolPage: React.FC = () => {
    // 2. 从后端下载重命名后的文件
    const handleDownload = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/download')
        // 将响应转换为 blob 对象
        const blob = await response.blob()
        // 创建一个临时的 a 标签触发下载
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'my_downloaded_file.txt' // 下载时保存在本地的文件名
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('下载失败:', error)
      }
    }

    const { Dragger } = Upload;

    const props: UploadProps = {
      name: "file",
      multiple: true,
      action: "http://127.0.0.1:5000/api/v1/upload",
      beforeUpload: (file) => {
        const isPDF = file.type === "application/pdf";
        message.info(`file.type: ${file.type} `);
        if (!isPDF) {
          message.error(`${file.name} is not a pdf file`);
        }
        return isPDF || Upload.LIST_IGNORE;
      },
      onChange(info) {
        const { status } = info.file;
        if (status !== "uploading") {
          console.log(info.file, info.fileList);
        }
        if (status === "done") {
          message.success(`${info.file.name} file uploaded successfully.`);
        } else if (status === "error") {
          message.error(`${info.file.name} file upload failed.`);
        }
      },
      onDrop(e) {
        console.log("Dropped files", e.dataTransfer.files);
      },
    };

    return (
      <div style={{ padding: "50px" }}>
        <h2>PDF工具</h2>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            点击或拖动文件到此区域进行上传
          </p>
          <p className="ant-upload-hint">
            支持单个或批量上传。请确保上传的文件格式正确。
          </p>
        </Dragger>
        <PDFThumbnailSelector />
        <br />
        <button onClick={handleDownload}>下载后端重命名后的文件</button>
      </div>
    );
};

export default PdfToolPage