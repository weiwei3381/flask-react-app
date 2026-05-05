import { Button, Col, Divider, message, Popconfirm, Row, Spin } from 'antd'
import type React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTitle } from '../../hooks'
import { useEffect, useState } from 'react'
import { convertDocTitle, dateToStr, type OutlineType } from '../../../utils'
import {
  getAllParasByDocumentId,
  getOutlineJsonByDocumentId,
  getParagraphById,
  getSomeParas,
} from '../../../utils/network'
import {
  DownCircleTwoTone,
  SmileTwoTone,
  UpCircleTwoTone,
} from '@ant-design/icons'
import SentenceHighlight from '../../components/SentenceHighlight'

const ArticlePage: React.FC = () => {
  const { paraId } = useParams()
  useTitle(`文章详情`) // 设置页面标题为
  const [searchParams, setSearchParams] = useSearchParams()
  const searchValue = searchParams.get('searchValue') || ''

  const [docInfo, setDocInfo] = useState({
    title: '文档详情',
    date: '2022-01-01',
    docId: null, // 当前文档id
    paraLength: 0, // 当前文档段落数
  }) // 模态框标题为文档标题
  const [currentPos, setCurrentPos] = useState([]) // 当前翻页的位置
  const [paras, setParas] = useState([]) // 显示的页面
  const [maxPageCount, setMaxPageCount] = useState(0) // 页面最大值
  const searchWords =
    searchValue.trim().length > 0 ? searchValue.split(/[ >》]+/g) : [] // 将搜索词拆分成列表, 保证能高亮显示
  const [isloading, setIsloading] = useState(false) // 完整的加载状态
  const [downLoading, setDownLoading] = useState(false) // 向下加载的状态
  const [upLoading, setUpLoading] = useState(false) // 向上加载的状态
  const [outlines, setOutlines] = useState<OutlineType[]>([]) // 文档的大纲
  const [jumpParaId, setJumpParaId] = useState<number>(null) // 跳转的段落id

  // 向上加载的页面
  const clickPreviousBtn = () => {
    const [lb, ub] = currentPos // 获得上下限
    setUpLoading(true)
    getSomeParas(jumpParaId ? jumpParaId : parseInt(paraId), lb - 5, lb - 1)
      .then((continuesParas) => {
        setParas([...continuesParas, ...paras])
        setUpLoading(false)
      })
      .catch((error) => {
        setUpLoading(false)
        return message.error(`出现错误:${error.message}`)
      })
    setCurrentPos([lb - 5, ub])
  }

  // 处理向下加载按钮
  const clickNextBtn = () => {
    const [lb, ub] = currentPos // 获得上下限
    setDownLoading(true)
    getSomeParas(jumpParaId ? jumpParaId : parseInt(paraId), ub + 1, ub + 10)
      .then((continuesParas) => {
        setParas([...paras, ...continuesParas])
        setDownLoading(false)
      })
      .catch((error) => {
        message.error(`出现错误:${error.message}`)
        setDownLoading(false)
      })
    setCurrentPos([lb, ub + 10])
  }

  // 处理加载全文按钮
  const clickLoadFullTextBtn = async () => {
    if (docInfo?.docId) {
      // 拿到所有页面后，设置段落并设置当前位置
      const paras = await getAllParasByDocumentId(docInfo.docId)
      setParas(paras)
      setCurrentPos([0, docInfo.paraLength - 1])
    }
  }

  useEffect(() => {
    const getContinuesParas = async () => {
      // 存在paraId说明已经双击结果了
      if (paraId) {
        setIsloading(true)
        const para = await getParagraphById(parseInt(paraId))
        const document = para.document
        // 拿到文档信息
        setDocInfo({
          title: convertDocTitle(document.title),
          date: dateToStr(document.date),
          docId: para.document.id,
          paraLength: para.document.paraLength,
        })
        // 拿到大纲
        const outlineJson = await getOutlineJsonByDocumentId(para.document.id)
        setOutlines(outlineJson)
        // 页码从0开始, 所以最大页面数得减1
        const maxPage = document.paraLength - 1
        setMaxPageCount(maxPage)
        const lb = para.order - 1 < 0 ? 0 : para.order - 1 // 下限
        const ub = para.order + 1 > maxPage ? maxPage : para.order + 1 // 上限
        setCurrentPos([lb, ub])
        window.document.title = convertDocTitle(document.title) // 将页面标题设置为文档标题
        const continuesParas = await getSomeParas(parseInt(paraId), lb, ub)
        setParas(continuesParas)
        setIsloading(false)
      }
    }
    getContinuesParas()
  }, [paraId])

  // 点击大纲后跳转到对应段落
  useEffect(() => {
    const getContinuesParas = async () => {
      // 存在jumpParaId说明已经点击大纲了
      if (jumpParaId) {
        setIsloading(true)
        const para = await getParagraphById(jumpParaId)
        const document = para.document
        // 页码从0开始, 所以最大页面数得减1
        const maxPage = document.paraLength - 1
        setMaxPageCount(maxPage)
        const lb = para.order - 1 < 0 ? 0 : para.order // 下限
        const ub = para.order + 1 > maxPage ? maxPage : para.order + 2 // 上限
        setCurrentPos([lb, ub])
        const continuesParas = await getSomeParas(jumpParaId, lb, ub)
        setParas(continuesParas)
        setIsloading(false)
      }
    }
    getContinuesParas()
  }, [jumpParaId])

  return (
    <>
      <h2
        style={{
          textAlign: 'center',
          marginTop: '20px',
          lineHeight: '1.25rem',
        }}
      >
        {`${docInfo.title}•${docInfo.date}`}
        <Popconfirm
          title={`全文共计${docInfo.paraLength}段, 是否加载全文?`}
          onConfirm={clickLoadFullTextBtn}
        >
          <Button type="link" style={{ marginLeft: '1em' }}>
            加载全文
          </Button>
        </Popconfirm>
      </h2>

      <Spin spinning={isloading} description="正在加载">
        <Row>
          {/* 大纲部分 */}
          <Col
            className="body catalogue"
            span={outlines.length > 0 ? 5 : 0}
            style={{
              overflowY: 'auto',
              height: 'calc(100vh - 55px)',
              borderRight: '2px solid #e0e0e0',
              background: '#fafafa',
              textAlign: 'justify',
              padding: '0 12px',
            }}
          >
            <div
              style={{
                color: '#1976d2',
                textAlign: 'center',
                margin: '4px 0 6px 0',
              }}
            >
              目 录
            </div>
            {outlines.map((outline) => (
              <div
                style={{
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  lineHeight: '1rem',
                  marginBottom: '5px',
                }}
                onClick={() => console.log(setJumpParaId(outline.paraId))}
              >
                {outline.title}
              </div>
            ))}
          </Col>

          {/* 正文部分 */}
          <Col
            className="body content"
            span={outlines.length > 0 ? 19 : 24}
            style={{ overflowY: 'auto', height: 'calc(100vh - 55px)' }}
          >
            {paraId && !isloading && (
              <div
                style={{
                  textAlign: 'center',
                  margin: '12px',
                  fontSize: '16px',
                }}
              >
                {upLoading && (
                  <div style={{ color: '#1976d2', fontSize: '14px' }}>
                    正在加载...
                  </div>
                )}
                {!upLoading &&
                  (currentPos[0] > 0 ? (
                    <Button
                      onClick={clickPreviousBtn}
                      icon={<UpCircleTwoTone />}
                    >
                      向上加载
                    </Button>
                  ) : (
                    <></>
                  ))}
              </div>
            )}
            {paraId &&
              paras.map((para) => (
                <p
                  key={para.id}
                  style={{
                    marginLeft: '3px',
                    textIndent: '2em',
                    textAlign: 'justify',
                    padding: '0 12px',
                    marginTop: '0.5em',
                    fontFamily: "'Noto Serif SC', '仿宋_GB2312', serif",
                    fontWeight: 'bolder',
                    fontSize: '1.4em',
                  }}
                >
                  <SentenceHighlight
                    paragraph={para.content}
                    highlightKeys={searchWords}
                    isSentenceHighlight={searchWords.length > 0 ? true : false} // 如果搜索词只有一个就高亮整个句子, 否则只高亮关键词
                    highlightStyle={{
                      wordColor: 'red',
                      sentenceBackgroundColor: '#ffec99',
                    }}
                    isDifferentColor={true}
                  />
                </p>
              ))}
            {paraId && !isloading && (
              <Divider>
                {downLoading && (
                  <span style={{ color: '#1976d2', fontSize: '14px' }}>
                    正在加载...
                  </span>
                )}
                {!downLoading &&
                  (currentPos[1] < maxPageCount ? (
                    <Button onClick={clickNextBtn} icon={<DownCircleTwoTone />}>
                      向下加载
                    </Button>
                  ) : (
                    <>
                      已经到底啦
                      <SmileTwoTone twoToneColor="#eb2f96" />
                    </>
                  ))}
              </Divider>
            )}
          </Col>
        </Row>
      </Spin>
    </>
  )
}

export default ArticlePage
