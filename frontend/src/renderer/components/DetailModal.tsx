/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import {
  UpCircleTwoTone,
  DownCircleTwoTone,
  SmileTwoTone,
} from '@ant-design/icons'
import { Button, Modal, Divider, message, Spin, Row, Col, Affix } from 'antd'
import copy from 'copy-to-clipboard'
import './DetailModal.css'
import {
  fetchUrl,
  getDocumentById,
  getOutlineJsonByDocumentId,
  getParagraphById,
  getSomeParas,
} from '../../utils/network'
import SentenceHighlight from './SentenceHighlight'
import { convertDocTitle, dateToStr, type OutlineType } from '../../utils'

interface SearchModalProps {
  searchValue?: string // 搜索关键词
  paraId?: number // 段落Id
  isModalLoading?: boolean // 模态框是否显示加载中
  isModalVisible?: boolean // 模态框是否可见
  isSentenceHighlight: boolean // 是否句子高亮显示
  closeModal: () => void
}

const DetailModal: React.FC<SearchModalProps> = ({
  paraId = undefined,
  isModalLoading = false,
  searchValue = '',
  isModalVisible,
  isSentenceHighlight,
  closeModal,
}) => {
  const [docInfo, setDocInfo] = useState({
    title: '文档详情',
    date: '2022-01-01',
  }) // 模态框标题为文档标题
  const [currentPos, setCurrentPos] = useState([]) // 当前翻页的位置
  const [paras, setParas] = useState([]) // 显示的页面
  const [maxPageCount, setMaxPageCount] = useState(0) // 页面最大值
  const searchWords = searchValue.split(/[ >》]+/g) // 将搜索词拆分成列表, 保证能高亮显示
  const [isloading, setIsloading] = useState(false) // 完整的加载状态
  const [downLoading, setDownLoading] = useState(false) // 向下加载的状态
  const [upLoading, setUpLoading] = useState(false) // 向上加载的状态
  const [outlines, setOutlines] = useState<OutlineType[]>([]) // 文档的大纲
  const [jumpParaId, setJumpParaId] = useState<number>(null) // 跳转的段落id
  const [citeText, setCiteText] = useState<string>('') // 当前文档的引用格式

  // 向上加载的页面
  const clickPreviousBtn = () => {
    const [lb, ub] = currentPos // 获得上下限
    setUpLoading(true)
    getSomeParas(jumpParaId ? jumpParaId : paraId, lb - 5, lb - 1)
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
    getSomeParas(jumpParaId ? jumpParaId : paraId, ub + 1, ub + 10)
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

  // 点击“引用本文”的处理函数
  const clickCiteBtn = () => {
    if (citeText.length < 1) {
      message.warning('正在生成引文格式, 请稍后！')
    } else {
      const copyStatus = copy(citeText)
      if (copyStatus) {
        message.success(`${citeText} 🎉`)
      }
    }
  }

  useEffect(() => {
    const getContinuesParas = async () => {
      // 存在paraId说明已经双击结果了
      if (paraId) {
        setIsloading(true)
        const para = await getParagraphById(paraId)
        const document = para.document
        // 拿到大纲
        const outlineJson = await getOutlineJsonByDocumentId(para.document.id)
        setOutlines(outlineJson)
        // 页码从0开始, 所以最大页面数得减1
        const maxPage = document.paraLength - 1
        setMaxPageCount(maxPage)
        const lb = para.order - 1 < 0 ? 0 : para.order - 1 // 下限
        const ub = para.order + 1 > maxPage ? maxPage : para.order + 1 // 上限
        setCurrentPos([lb, ub])
        setDocInfo({
          title: convertDocTitle(document.title),
          date: dateToStr(document.date),
        })
        const continuesParas = await getSomeParas(paraId, lb, ub)
        setParas(continuesParas)
        setIsloading(false)
      }
    }
    getContinuesParas()
  }, [paraId])

  useEffect(() => {
    setIsloading(isModalLoading)
  }, [isModalLoading])

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
    <Modal
      className="article-detail"
      style={{ top: '5vh' }}
      styles={{
        body: {
          height: '75vh',
          overflow: 'auto',
          padding: '0 8px',
        },
      }}
      title={
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontFamily: `"FZXiaoBiaoSong-B05S", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
              fontSize: '1.05em',
              fontWeight: 'bold',
            }}
          >
            {`${docInfo.title}•${docInfo.date}`}
          </span>
          <Button
            onClick={clickCiteBtn}
            size="small"
            type="link"
            style={{ fontSize: '0.8em', marginLeft: '2em' }}
          >
            引用本文
          </Button>
        </div>
      }
      width="80vw"
      open={isModalVisible}
      onCancel={() => {
        // 关闭模态框并清空内容
        closeModal()
        setParas([])
        setOutlines([])
        setJumpParaId(null)
      }}
      footer={null}
    >
      <Spin spinning={isloading} description="正在加载">
        <Row>
          {/* 大纲部分 */}
          <Col
            className="body catalogue"
            span={outlines.length > 0 ? 5 : 0}
            style={{
              overflowY: 'auto',
              height: '75vh',
              borderRight: '2px solid #e0e0e0',
              background: '#fafafa',
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
            style={{ overflowY: 'auto', height: '75vh' }}
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
                    marginTop: '0.5em',
                    fontFamily: "'Noto Serif SC', '仿宋_GB2312', serif",
                    fontWeight: 'bolder',
                    fontSize: '1.4em',
                  }}
                >
                  <SentenceHighlight
                    paragraph={para.content}
                    highlightKeys={searchWords}
                    isSentenceHighlight={isSentenceHighlight}
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
    </Modal>
  )
}

export default DetailModal
