import { Button } from 'antd'
import React, { useState } from 'react'


const PdfToolPage: React.FC = () => {
  const [pdfValue, setPdfValue] = useState("PDF工具");

  return (
    <>
      <h2>{pdfValue}</h2>
      <Button onClick={()=>{setPdfValue("上传PDF1")}}>上传PDF</Button>
    </>
  );
};

export default PdfToolPage