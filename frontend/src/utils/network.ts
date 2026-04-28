import { message } from "antd";
import type { Document, Outline, OutlineType, Paragraph, ResponseData } from '.'

const BASE_URL = 'http://127.0.0.1:5000' // 后端API的基础URL

export const fetchUrl = async (url, payload, method = 'POST') => {
  let res: ResponseData = null
  try {
    // 发送 POST 请求到 Flask 后端
    const response = await fetch(BASE_URL + url, {
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

/**
 * 根据id获取段落内容
 * @param paraId 段落ID
 * @returns
 */
export const getParagraphById = async (paraId: number) => {
  const res = await fetchUrl('/api/v1/paragraph/id', { paragraphId: paraId })
  if (res && res.data) {
    return res.data as Paragraph
  } else {
    message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
    return null
  }
}

export const getAllParasByDocumentId = async (documentId: number) => {
  const res = await fetchUrl('/api/v1/paragraph/all', {
    documentId: documentId,
  })
  if (res && res.data) {
    return res.data as Paragraph[]
  } else {
    message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
    return []
  }
}

export const getOneParaByDocumentId = async (documentId: number) => {
  const res = await fetchUrl('/api/v1/paragraph/one', {
    documentId: documentId,
  })
  if (res && res.data) {
    return res.data as Paragraph
  } else {
    message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
    return null
  }
}

/**
 * 根据文档id获得文档内容
 * @param documentId 文档id
 * @returns
 */
export const getDocumentById = async (documentId: number) => {
  const res = await fetchUrl('/api/v1/document/id', { documentId: documentId })
  if (res && res.data) {
    return res.data as Document
  } else {
    message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
    return null
  }
}

/**
 *
 * @param documentId 文档id
 * @returns
 */
export const getOutlineJsonByDocumentId = async (documentId: number) => {
  const res = await fetchUrl('/api/v1/outline/query', {
    documentId: documentId,
  })
  if (res && res.data) {
    const outline = res.data as Outline
    const outlines: OutlineType[] = JSON.parse(outline.outlineWithParaId)
    return outlines
  } else {
    return []
  }
}

/**
 * 用于文章显示时,根据段落位置获取段落内容
 * @param paraId 段落ID
 * @param currentPos 当前段落位置
 * @returns 获得部分段落内容
 */
export const getSomeParas = async (paraId: number, lb: number, ub: number) => {
  const res = await fetchUrl('/api/v1/paragraph/query', {
    paragraphId: paraId,
    lb: lb,
    ub: ub,
  })
  if (res && res.data) {
    return res.data as Paragraph[]
  } else {
    message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
    return []
  }
}

/**
 * 
 * @param searchValue 搜索内容
 * @param minDistance 不同内容之间的距离
 * @returns 段落ids
 */
export const searchFullText = async (searchValue: string, minDistance = 0) => {
  const res = await fetchUrl('/api/v1/paragraph/fulltext', {
    searchValue: searchValue,
    minDistance: minDistance,
  })
  if (res && res.data) {
    return res.data as number[]
  } else {
    message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
    return []
  }
}

/**
 * 按照确保不同搜索内容在同一句子内部过滤段落ids
 * @param searchValue 搜索内容
 * @param minDistance 不同内容之间的距离
 * @returns 不同内容在同一句话中的段落ids
 */
export const filterInLineResult = async (searchValue: string,
    minDistance: number) => {
    const res = await fetchUrl('/api/v1/paragraph/inline', {
        searchValue: searchValue,
        minDistance: minDistance,
    })
    console.log("res:", res);
    
    if (res && res.data) {
        return res.data as number[]
    } else {
        message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
        return []
    }
}

export const getParagraphsByIds = async (paraIds: number[], pageNo=1, pageSize=10) => {
    const res = await fetchUrl('/api/v1/paragraph/ids', {
        ids: paraIds,
        pageNo: pageNo,
        pageSize: pageSize,
    })
    if (res && res.data) {
        return res.data as Paragraph[]
    } else {
        message.error(`获取数据失败：${res ? res.message : '未知错误'}`)
        return []
    }
}