import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import './PDFThumbnailSelector.css'; // 引入自定义样式

// 自定义Prop类型
interface PDFThumbnailSelectorProps {
  pdfUrl: string; // PDF文件的URL
  selectPagesCallback: (pages: number[]) => void; // 选中页码的回调函数
}

// 设置 PDF.js Worker，防止出现渲染报错
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PDFThumbnailSelector = ({ pdfUrl, selectPagesCallback }: PDFThumbnailSelectorProps) => {
  // 替换为你实际的 PDF 文件路径或 Base64 字符串
  const pdfFileUrl = "http://127.0.0.1:5000/uploads/test.pdf";

  const [numPages, setNumPages] = useState(null); // PDF总页数
  const [selectedPages, setSelectedPages] = useState([]); // 存储被选中的页码数组

  // PDF 加载成功后的回调
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // 处理缩略图的点击选中/取消
  const toggleSelectPage =  (pageNum) => {
    setSelectedPages((prev) => 
      prev.includes(pageNum) 
        ? prev.filter(p => p !== pageNum) // 如果已存在则移除
        : [...prev, pageNum] // 如果不存在则添加
    );
  };

  return (
    <div>
      <Document file={pdfFileUrl} onLoadSuccess={onDocumentLoadSuccess}>
        {/* 缩略图容器 */}
        <div className="thumbnail-container">
          {Array.from(new Array(numPages), (el, index) => (
            <div 
              key={`page_${index + 1}`} 
              className={`thumbnail-item ${selectedPages.includes(index + 1) ? 'selected' : ''}`}
              onClick={() => toggleSelectPage(index + 1)}
            >
              <Page pageNumber={index + 1} width={150} /> {/* 缩略图宽度设为150 */}
              <span>第 {index + 1} 页</span>
            </div>
          ))}
        </div>
      </Document>
      
      <div>当前已选中页码: {selectedPages.join(', ')}</div>
    </div>
  );
};

export default PDFThumbnailSelector;