import { Button } from 'antd'
import React, { useState } from 'react'


const PdfToolPage: React.FC = () => {
    const [file, setFile] = useState(null)

    // 处理文件选择
    const handleFileChange = (e) => {
      setFile(e.target.files[0])
    }

    // 1. 提交文件到后端
    const handleUpload = async () => {
      if (!file) return alert('请先选择一个文件！')

      const formData = new FormData()
      formData.append('file', file) // 'file' 必须与后端接收的字段名一致

      try {
        const response = await fetch('http://127.0.0.1:5000/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (data.status === 'success') {
          alert(`上传成功！后端已将文件重命名为: ${data.new_filename}`)
        }
      } catch (error) {
        console.error('上传失败:', error)
      }
    }

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

    return (
      <div style={{ padding: '50px' }}>
        <h2>React + Flask 文件上传与下载</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
          上传文件
        </button>
        <br />
        <br />
        <button onClick={handleDownload}>下载后端重命名后的文件</button>
      </div>
    )
};

export default PdfToolPage