import { useState } from 'react'
import { Button, DatePicker, Input } from 'antd';

function App() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // 发送 POST 请求到 Flask 后端
      const response = await fetch('http://127.0.0.1:5000/api/greet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name }),
      })

      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      console.error('请求出错:', error)
      setMessage('连接后端失败，请检查后端是否启动。')
    }
  }

  return (
    <div
      style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}
    >
      <h1>React + Flask 示例</h1>
        <DatePicker />

        <Input type="text"
          placeholder="请输入你的名字"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '20vw' }} />
        <Button onClick={handleSubmit} style={{ padding: '10px 20px' }}>
          发送问候
        </Button>

      {message && (
        <div style={{ marginTop: '20px', color: 'green', fontSize: '1.2em' }}>
          <p>{message}</p>
        </div>
      )}
    </div>
  )
}

export default App