import React, { useState } from 'react'
import {
  FilePdfOutlined,
  FileSearchOutlined,
  HomeOutlined,
  MonitorOutlined,
  ProfileOutlined,
  QrcodeOutlined,
  ReconciliationTwoTone,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Layout, Menu, theme } from 'antd'
import './App.css'
import DocumentsPage from './renderer/pages/documentPage'
import StructurePage from './renderer/pages/structurePage'

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
  getItem('结构搜索', '结构搜索', <ProfileOutlined />),
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
          {collapsed ? <ReconciliationTwoTone /> : '多粒度检索系统'}
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['欢迎']}
          mode="inline"
          items={items}
          onSelect={(info) => {
            setSelectedMenuKey(info.key)
            console.log(info)
          }}
        />
      </Sider>

      <Layout>
        <Content
          style={{
            margin: '12px 10px 0',
            overflow: 'initial',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {selectedMenuKey == '文档检索' && <DocumentsPage />}
          {selectedMenuKey == '结构搜索' && <StructurePage />}
        </Content>
        <Footer style={{ textAlign: 'center', padding: '10px' }}>
          多粒度文档检索系统 ©{new Date().getFullYear()} Created by 大熊
        </Footer>
      </Layout>
    </Layout>
  )
}

export default App
