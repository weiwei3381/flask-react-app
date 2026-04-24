/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react'
import {
  CalendarTwoTone,
  FilePdfOutlined,
  FileSearchOutlined,
  HomeOutlined,
  MonitorOutlined,
  OrderedListOutlined,
  ProjectFilled,
  ProjectTwoTone,
  QrcodeOutlined,
  ReconciliationTwoTone,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Layout, Menu, Tabs, theme } from 'antd'
import './App.css'
import DocumentsPage from './renderer/pages/documentPage'
import StructurePage from './renderer/pages/structurePage'
import WelcomePage from './renderer/pages/welcomePage/WelcomePage'
import PandaSvg from './renderer/components/PandaSvg'

const { Content, Footer, Sider } = Layout

const siderStyle: React.CSSProperties = {
  overflow: 'auto',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
}

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem
}

const items: MenuItem[] = [
  getItem('欢迎', '欢迎', <HomeOutlined />),
  getItem('全文检索', '全文检索', <MonitorOutlined />),
  getItem('结构搜索', '结构搜索', <OrderedListOutlined />),
  getItem('文档检索', '文档检索', <FileSearchOutlined />),
  getItem('常用工具', '常用工具', <ToolOutlined />, [
    getItem('二维码', '二维码', <QrcodeOutlined />),
    getItem('pdf工具', 'pdf工具', <FilePdfOutlined />),
  ]),
  getItem('设置', '设置', <SettingOutlined />),
]

const App: React.FC = () => {
  const [selectedMenuKey, setSelectedMenuKey] = useState('结构搜索')
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Layout hasSider>
      <Sider
        style={siderStyle}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="demo-logo-vertical">
          {collapsed ? <PandaSvg /> : '多粒度检索系统'}
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['欢迎']}
          mode="inline"
          items={items}
          onSelect={(info) => {
            setSelectedMenuKey(info.key)
            console.log(info)
            switch (info.key) {
              case '文档检索':
                console.log('跳转到文档检索页面')
                break
              case '结构搜索':
                console.log('跳转到结构检索页面')
                break

              default:
                break
            }
          }}
        />
      </Sider>

      <Layout>
        <Content
          id="myContent"
          style={{
            margin: '12px 10px 0',
            overflow: 'initial',
            // background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {/* {selectedMenuKey == '文档检索' && <DocumentsPage />}
          {selectedMenuKey == '结构搜索' && <StructurePage />} */}
          <Tabs type="editable-card">
            <Tabs.TabPane tab="欢迎" key="欢迎">
              <WelcomePage />
            </Tabs.TabPane>
            <Tabs.TabPane tab="文档检索" key="文档检索">
              <DocumentsPage />
            </Tabs.TabPane>
            <Tabs.TabPane tab="文档检索22" key="文档检索22">
              <DocumentsPage />
            </Tabs.TabPane>
            <Tabs.TabPane tab="结构搜索" key="结构搜索">
              <StructurePage />
            </Tabs.TabPane>
          </Tabs>
        </Content>
        <Footer style={{ textAlign: 'center', padding: '10px' }}>
          多粒度文档检索系统 ©{new Date().getFullYear()} Created by 大熊
        </Footer>
      </Layout>
    </Layout>
  )
}

export default App
