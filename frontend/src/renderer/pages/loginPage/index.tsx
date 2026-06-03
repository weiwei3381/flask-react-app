import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, Card, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../../auth/auth'

const { Title, Text } = Typography

const LoginPage: React.FC = () => {
  const { isLoggedIn, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (!isLoading && isLoggedIn) {
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, isLoading, navigate])

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    const success = await login(values.username, values.password)
    setLoading(false)
    if (success) {
      navigate('/', { replace: true })
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100%',
          minWidth: '720px',
        }}
      >
        加载中...
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        minWidth: '720px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={3} style={{ marginBottom: 0 }}>
            多粒度检索系统
          </Title>
          <Text type="secondary">请登录您的账户</Text>
        </Space>

        <Form
          name="login"
          style={{ marginTop: 24 }}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage
