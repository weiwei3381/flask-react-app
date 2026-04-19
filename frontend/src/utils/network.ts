import { message } from "antd";
import type { ResponseData } from "."

export const fetchUrl = async (url, payload, method='POST') => {
    let res: ResponseData = null;
    try {
      // 发送 POST 请求到 Flask 后端
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      res = await response.json()
      
    } catch (error) {
      message.error(`获取服务器数据出错：${error}`)
    }

    return res
  }