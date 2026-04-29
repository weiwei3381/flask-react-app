import { Carousel, Col, Input, QRCode, Row } from 'antd'
import React, { useEffect, useState } from 'react'
import './QRToolPage.css'

const QRToolPage: React.FC = () => {
  const [qrValue, setQrValue] = useState('')
  const { TextArea } = Input

  const splitStringIntoChunks = (str: string, chunkSize = 500): string[] => {
    const chunks = []
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.slice(i, i + chunkSize))
    }
    return chunks
  }

  return (
    <Row className="my-QRtool">
      <Col span={24}>
        <h1>二维码工具</h1>
        <TextArea
          placeholder="请输入要生成二维码的数据"
          autoSize={{ minRows: 4, maxRows: 15 }}
          value={qrValue}
          onChange={(e) => setQrValue(e.target.value)}
          showCount
          maxLength={10000}
          allowClear
        />
      </Col>
      <Col
        span={24}
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '20px 0px',
        }}
      >
        <Carousel
          dotPlacement="bottom"
          autoplaySpeed={5000}
          autoplay={{ dotDuration: true }}
          arrows
          dots={{
            className: 'custom-carousel-dots',
          }}
          style={{
            width: '640px',
            height: '640px',
            padding: '20px',
          }}
        >
          {splitStringIntoChunks(qrValue).map((chunk, index) => {
            return (
              <div key={index}>
                <QRCode value={chunk} size={600} />
              </div>
            )
          })}
        </Carousel>
      </Col>
    </Row>
  )
}

export default QRToolPage
