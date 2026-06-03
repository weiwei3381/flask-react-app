/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react'
import { Row, Col, Card, Statistic, Empty, Spin } from 'antd'
import LocalStorageManager from '../../../utils/localStorage'
import * as echarts from 'echarts'

const WelcomePage: React.FC = () => {
  const echartsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!echartsRef.current) return

    const dailyCounts = LocalStorageManager.getSearchDailyCounts(10)
    const dates = dailyCounts.map((d) => d.date.slice(5)) // MM-DD 格式
    const counts = dailyCounts.map((d) => d.count)

    const chart = echarts.init(echartsRef.current)
    chart.setOption({
      title: {
        text: '最近10天搜索次数',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [
        {
          name: '搜索次数',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#4263eb',
          },
        },
      ],
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [])

  return (
    <div style={{ marginTop: '12px' }}>
      <Row gutter={[20, 40]}>
        <Col span={8}>
          <Card>
            <Statistic
              valueStyle={{ color: '#f03e3e' }}
              value={LocalStorageManager.getNameSpaceItem('welcomePage', 'documentTotal', 0)}
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
                LocalStorageManager.getNameSpaceItem('welcomePage', 'structureTotal', 0) / 10000
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
              value={LocalStorageManager.getNameSpaceItem('welcomePage', 'searchCount', 0)}
              title="搜索次数"
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ height: '60vh' }}>
            <div ref={echartsRef} style={{ height: '60vh' }}></div>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ height: '60vh' }} id="wordCloudCard">
            <Empty style={{ paddingTop: '10vh' }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default WelcomePage
