/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react'
import { Row, Col, Card, Statistic, Empty, Spin } from 'antd'
import LocalStorageManager from '../../../utils/localStorage'
import * as echarts from 'echarts'

const WelcomePage: React.FC = () => {
  const echarts_test_ref = useRef(null)
  useEffect(() => {
    console.log(echarts_test_ref.current)

    // 绘制图表
    const myChart = echarts.init(echarts_test_ref.current as HTMLDivElement)
    myChart.setOption({
      title: {
        text: 'ECharts 入门示例',
      },
      tooltip: {},
      xAxis: {
        data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
      },
      yAxis: {},
      series: [
        {
          name: '销量',
          type: 'bar',
          data: [5, 20, 36, 10, 10, 20],
        },
      ],
    })
  }, [])

  return (
    <div style={{ marginTop: '64px' }}>
      <Row gutter={[24, 48]}>
        <Col span={8}>
          <Card>
            <Statistic
              valueStyle={{ color: '#f03e3e' }}
              value={LocalStorageManager.getNameSpaceItem(
                'welcomePage',
                'documentTotal',
                0
              )}
              title="文档总数"
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              valueStyle={{ color: '#4263eb' }}
              value={
                LocalStorageManager.getNameSpaceItem(
                  'welcomePage',
                  'structureTotal',
                  0
                ) / 10000
              }
              title="标题观点数"
              precision={2}
              suffix="万个"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              valueStyle={{ color: '#37b24d' }}
              value={LocalStorageManager.getNameSpaceItem(
                'welcomePage',
                'searchCount',
                0
              )}
              title="搜索次数"
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ height: '55vh' }}>
            <div ref={echarts_test_ref} style={{ height: '55vh' }}></div>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ height: '55vh' }} id="wordCloudCard">
            <Empty style={{ paddingTop: '10vh' }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default WelcomePage
