import React, { useState } from 'react'
import {
  FilePdfOutlined,
  FileSearchOutlined,
  HomeOutlined,
  MonitorOutlined,
  OrderedListOutlined,
  QrcodeOutlined,
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

// 初始标签页内容
const initialItems = [
  {
    label: '欢迎',
    children: <WelcomePage />,
    key: '1',
    closable: false,
  },
]

type TargetKey = React.MouseEvent | React.KeyboardEvent | string

const App: React.FC = () => {
  const [selectedMenuKey, setSelectedMenuKey] = useState('结构搜索')
  const [activeKey, setActiveKey] = useState('1') // 当前激活的标签页key
  const [tabsItems, setTabsItems] = useState(initialItems) // 标签页的内容
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  // 根据点击的菜单key不同增加标签
  const addTabByClickMenu = (menuKey: string) => {
    const addKey = Number(tabsItems[tabsItems.length - 1].key) + 1 + ''
    switch (menuKey) {
      case '文档检索': {
        setTabsItems([
          ...tabsItems,
          {
            label: '文档检索',
            children: <DocumentsPage />,
            key: addKey,
            closable: true,
          },
        ])
        setActiveKey(addKey)
        break
      }
      case '结构搜索': {
        setTabsItems([
          ...tabsItems,
          {
            label: '结构搜索',
            children: <StructurePage />,
            key: addKey,
            closable: true,
          },
        ])
        setActiveKey(addKey)
        break
      }
      case '欢迎':
        setActiveKey('1')
        break

      default:
        break
    }
  }

  // 移除指定标签
  const removeTargetTab = (targetKey: TargetKey) => {
    let newActiveKey = activeKey
    let lastIndex = -1
    tabsItems.forEach((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1
      }
    })
    const newPanes = tabsItems.filter((item) => item.key !== targetKey)
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key
      } else {
        newActiveKey = newPanes[0].key
      }
    }
    setTabsItems(newPanes)
    setActiveKey(newActiveKey)
  }

  // 标签更改函数
  const onEditTabs = (targetKey: TargetKey, action: 'add' | 'remove') => {
    if (action === 'add') {
      addTabByClickMenu(selectedMenuKey)
    } else {
      removeTargetTab(targetKey)
    }
  }

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
            addTabByClickMenu(info.key)
          }}
        />
      </Sider>

      <Layout>
        <Content
          id="myContent"
          style={{
            margin: '12px 10px 0',
            overflow: 'initial',
            borderRadius: borderRadiusLG,
          }}
        >
          <Tabs
            activeKey={activeKey}
            type="editable-card"
            items={tabsItems}
            onChange={(key) => setActiveKey(key)}
            onEdit={onEditTabs}
          />
        </Content>
        <Footer style={{ textAlign: 'center', padding: '10px' }}>
          多粒度文档检索系统 ©{new Date().getFullYear()} Created by 大熊
        </Footer>
      </Layout>
    </Layout>
  )
}

export default App
