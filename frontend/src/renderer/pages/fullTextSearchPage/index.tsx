/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 全文检索页面
 */

import React, { useState, useEffect } from 'react'
import {
  notification,
  Table,
  Spin,
  message,
  Rate,
  Affix,
  Switch,
  Row,
  Col,
  Select,
  Tooltip,
  Slider,
  Space,
  Input,
} from 'antd'
import { AliwangwangOutlined } from '@ant-design/icons'
import './index.css'
import ColorDiv from '../../components/ColorDiv'
import SentenceHighlight from '../../components/SentenceHighlight'
import SearchHistory from '../../components/SearchHistory'
import DetailModal from '../../components/DetailModal'
import { backToTop, convertDocTitle, dateToStr, unique } from '../../../utils'
import {
  filterInLineResult,
  getParagraphsByIds,
  searchFullText,
} from '../../../utils/network'

const FullTextSearch: React.FC = () => {
  // 用户搜索词有两种状态，一种是刚输入进去，但是还没有进行提交搜索的文本，也就是输入框中的词，这种状态为“inputValue”
  // 还有一种是用户提交的搜索词，可以是输入进去之后按回车或者点击搜索，也有可能是点击的历史记录，这种搜索词为“searchValue”
  const [inputValue, setInputValue] = useState('') // 输入框内的文本
  const [searchValue, setSearchValue] = useState('') // 用户输入的搜索值

  const [rawParaIds, setRawParaIds] = useState([]) // 使用倒排索引搜索到的初步结果ids
  const [searchResult, setSearchResult] = useState({
    total: 0, // 结果总数
    resultParaIdList: null, // 结果Map
  }) // 搜索结果, 包括结果的数量和结果Map
  const [filter, setFilter] = useState({}) // 搜索过滤
  const [searchResultData, setSearchResultData] = useState([]) // 搜索结果
  const [tableLoading, setTableLoading] = useState(false) // 是否显示正在加载
  const [selectParaId, setSelectParaId] = useState(undefined) // 双击选择的段落Id
  const [modalVisible, setModalVisible] = useState(false) // 模态框是否显示
  // [确保句内]的开关是否可用
  const [switchStatus, setSwitchStatus] = useState({
    isSwitchDisable: true,
    isSwitchChecked: false,
  })
  const [loadingTip, setLoadingTip] = useState('正在导入数据') // 导入文字
  // 默认的页码设置
  const defaultPageOption = {
    pageNo: 1,
    pageSize: 10,
  }

  const [pageOption, setPageOption] = useState(defaultPageOption) // 页码设置
  const [minDistance, setMinDistance] = useState(0) // 搜索时传入的最近距离

  // 段落id列表或者where过滤器变化, 则重新加载搜索结果
  useEffect(() => {
    loadSearchResult()
  }, [rawParaIds, filter])

  const columns = [
    {
      title: '#',
      dataIndex: 'paraId',
      key: 'paraId',
      ellipsis: true,
      width: '6%',
      render: (text, item, dataIndex) => {
        return pageOption.pageSize * (pageOption.pageNo - 1) + dataIndex + 1
      },
    },
    {
      title: '搜索内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: false,
      width: '73%',
      render: (text) => {
        return (
          <SentenceHighlight
            paragraph={text}
            highlightKeys={searchValue.split(/[ >》]+/g)}
            // highlightKeys={searchValue.split(/[ >》]+/g)}
            isSentenceHighlight={switchStatus.isSwitchChecked}
            highlightStyle={{
              sentenceBackgroundColor: '#ffec99',
              wordColor: 'red',
            }}
            isDifferentColor={true}
          />
        )
      },
    },
    {
      title: '文档名称',
      dataIndex: 'documentName',
      key: 'documentName',
      ellipsis: false,
      width: '13%',
      render: (text: string, item) => {
        // 去重后的文档标题列表列表
        const titleList = unique(searchResultData.map((d) => d.document.title))
        const index = Math.max(titleList.indexOf(text), 0)
        // 判断名称前后的书名号
        const docTitle = convertDocTitle(item.document.title)

        return (
          <ColorDiv
            url={`/article/${item.id}?searchValue=${searchValue}`}
            colorIndex={index}
            contentList={[docTitle, dateToStr(item.document.date)]}
          />
        )
      },
    },
  ]

  /**
   * 进行全文搜索
   * @param value 搜索框传入值
   * @param isSave 是否存入搜索历史
   */
  async function handleSearch(value: string) {
    if (!value || value.trim().length === 0) return
    setLoadingTip(`正在搜索【${value}】`)
    setTableLoading(true) // 开启loading
    // 将搜索情况加入历史
    // setting.set('search_count', setting.get('search_count') + 1)
    // 倒排索引的段落IDs
    const rawParaIds = await searchFullText(value.trim(), minDistance) // 全文搜索
    if (value && value.length > 0 && rawParaIds.length === 0) {
      message.warning(`Sorry，关键词【${value}】找不到结果`, 1.5)
    }
    setRawParaIds(rawParaIds)
    setTableLoading(false) // 取消loading
  }

  const loadSearchResult = async () => {
    if (!searchValue || searchValue.trim().length === 0) return
    try {
      let paraIds = rawParaIds
      // 如果打开句内共现开关, 则更新paraId
      if (switchStatus.isSwitchChecked) {
        paraIds = await filterInLineResult(searchValue, minDistance) // 句内段落ID列表
      }
      setSearchResult({
        total: paraIds.length,
        resultParaIdList: paraIds,
      })
      // 每次搜索都将页码设为默认值
      setPageOption(defaultPageOption)
      // 直接按照默认值进行检索
      const paraResults = await getParagraphsByIds(
        paraIds,
        defaultPageOption.pageNo,
        defaultPageOption.pageSize
      )
      setSearchResultData(paraResults) // 把搜索结果放到table中
      const searchParts = searchValue.split(/[ >》]+/g) // 按空格将搜索关键词进行分割
      if (searchParts.length > 1) {
        setSwitchStatus({
          ...switchStatus,
          isSwitchDisable: false,
        })
      } else {
        setSwitchStatus({
          isSwitchDisable: true,
          isSwitchChecked: false,
        })
      }
    } catch (err) {
      message.error(`搜索关键词[${searchValue}]出现错误:${err}`)
    }
    backToTop() // 回到顶部
  }

  // 导入数据错误的回调函数
  const importErrorCallback = (msg) => {
    notification.error({
      message: '操作出错',
      description: `${msg}`,
      duration: 0,
      icon: <AliwangwangOutlined style={{ color: '#FAAD14' }} />,
    })
  }

  // 处理分页变换
  const handlePaginationChange = async (current, pageSize) => {
    setPageOption({
      pageNo: current,
      pageSize: pageSize,
    })
    const paraResults = await getParagraphsByIds(
      searchResult.resultParaIdList,
      current,
      pageSize
    )
    setSearchResultData(paraResults)
  }

  // 处理打开开关的情况
  const handleSwitchOn = async () => {
    // 每次搜索都将页码设为默认值开始
    setPageOption(defaultPageOption)
    const inLineParaIdList = await filterInLineResult(searchValue, minDistance) // 句内段落ID列表
    setSearchResult({
      total: inLineParaIdList.length,
      resultParaIdList: inLineParaIdList,
    })
    const searchResults = await getParagraphsByIds(
      inLineParaIdList,
      defaultPageOption.pageNo,
      defaultPageOption.pageSize
    ) // 获得搜索结果
    setSearchResultData(searchResults)
    backToTop() // 回到页面顶端
  }

  const { Option } = Select
  const marks = {
    0: {
      style: {
        color: '#2ecc71',
        fontSize: '12px',
      },
      label: <strong>距离不限</strong>,
    },
    10: {
      style: {
        color: '#5d5c5c',
        fontSize: '12px',
      },
      label: <strong>10</strong>,
    },
    20: {
      style: {
        color: '#5d5c5c',
        fontSize: '12px',
      },
      label: <strong>20</strong>,
    },
  }

  return (
    <div className="full-search">
      <Spin tip={loadingTip} spinning={tableLoading}>
        <Affix offsetTop={36}>
          <Row
            justify="center"
            align="middle"
            style={{ marginBottom: '0px', background: '#f0f2f5' }}
          >
            <Col xs={18} sm={9} lg={10} xl={11}>
              <Space.Compact>
                <Space.Addon>全文搜索</Space.Addon>
                <Input.Search
                  placeholder="请输入搜索关键词"
                  allowClear
                  enterButton
                  onSearch={() => {
                    setPageOption(defaultPageOption) // 搜索词变化时重置页码
                    setSearchValue(inputValue)
                    handleSearch(inputValue)
                  }}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e?.target?.value)
                  }}
                />
              </Space.Compact>
            </Col>
            <Col xs={6} sm={4} lg={3} xl={2}>
              <Slider
                style={{
                  width: 'calc(100% - 35px)',
                  marginLeft: '25px',
                  height: '12px',
                }}
                max={20}
                marks={marks}
                onChange={(value) => setMinDistance(value)}
              ></Slider>
            </Col>
            <Col xs={6} sm={3} lg={3} xl={3} style={{ textAlign: 'center' }}>
              <Tooltip title="多个搜索词可用，确保多搜索词在同一句子中出现">
                <span style={{ fontSize: '16px' }}>同句：</span>
                <Switch
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                  checked={switchStatus.isSwitchChecked}
                  disabled={switchStatus.isSwitchDisable}
                  onClick={async (checked) => {
                    setSwitchStatus({
                      ...switchStatus,
                      isSwitchChecked: checked,
                    })
                    if (checked) {
                      await handleSwitchOn()
                    } else {
                      await handleSearch(searchValue)
                    }
                  }}
                />
              </Tooltip>
            </Col>
          </Row>
        </Affix>
        <SearchHistory
          historyType="fullTextPage"
          searchValue={searchValue}
          onClickValue={async (value) => {
            setSearchValue(value.trim())
            setInputValue(value.trim())
            setPageOption(defaultPageOption)
            await handleSearch(value)
          }}
        />
        <Table
          onRow={(record) => {
            return {
              // 双击打开详情模态框
              onDoubleClick: () => {
                setModalVisible(true)
                setSelectParaId(record.id)
              },
            }
          }}
          // 分页情况
          pagination={{
            defaultCurrent: 1,
            showTotal: () => `共${searchResult.total}条结果`,
            total: searchResult.total,
            current: pageOption.pageNo,
            pageSize: pageOption.pageSize,
          }}
          // 分页跳转的方法
          onChange={(pagination) => {
            const { current, pageSize } = pagination
            handlePaginationChange(current, pageSize)
            backToTop() // 返回页面顶部
          }}
          rowKey="paraId"
          columns={columns}
          dataSource={searchResultData}
        />
      </Spin>
      <DetailModal
        isModalVisible={modalVisible} // modal显示情况
        isSentenceHighlight={switchStatus.isSwitchChecked} // 是否显示高亮句子
        closeModal={() => {
          setModalVisible(false)
          setSelectParaId(null) // 清空选中的段落ID，否则再次打开相同对象paraId没更新导致空白
        }} // 关闭模态框的函数
        searchValue={searchValue}
        paraId={selectParaId}
      />
    </div>
  )
}

export default FullTextSearch
