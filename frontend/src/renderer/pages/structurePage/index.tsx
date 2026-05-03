import React, { useEffect, useState } from 'react'
import { Affix, Col, Input, Row, Select, Space, Spin, Table, Tag } from 'antd'
import SentenceHighlight from '../../components/SentenceHighlight'
import {
  backToTop,
  convertDocTitle,
  unique,
  type StructureResult,
} from '../../../utils'
import { fetchUrl } from '../../../utils/network'
import DetailModal from '../../components/DetailModal'
import ColorDiv from '../../components/ColorDiv'
import './index.css'
import LocalStorageManager from '../../../utils/localStorage'
import SearchHistory from '../../components/SearchHistory'

const { Search } = Input

const StructurePage: React.FC = () => {
  const defaultPageOption = {
    pageNo: 1,
    pageSize: 10,
  } // 默认的页码设置
  const [searchValue, setSearchValue] = useState('') // 提交的搜索词
  const [inputValue, setInputValue] = useState('') // 输入框内的搜索词
  const [pageOption, setPageOption] = useState(defaultPageOption) // 当前页码
  const [searchResult, setSearchResult] = useState([]) // 搜索结果
  const [total, setTotal] = useState(0) // 结果总数
  const [modalVisible, setModalVisible] = useState(false) // 模态框可见性
  const [modalLoading, setModalLoading] = useState(true) // 模态框是否显示加载中
  const [selectParaId, setSelectParaId] = useState(null) // 双击的标题首段id
  const [tableLoading, setTableLoading] = useState(false) // 是否显示正在加载

  // 普通搜索的条件
  const [searchCondition, setSearchCondition] = useState<{
    isIncludeHigherTitle: 'yes' | 'no'
    titleLevel: number
  }>({
    isIncludeHigherTitle: 'no', // 是否包括上级标题
    titleLevel: null, // 搜索标题级别，1,2,3，4分别是一级、二级、三级和四级标题，9是观点，-1是所有的标题
  })

  // 处理分页变换
  const handlePaginationChange = (current, pageSize) => {
    setPageOption({
      pageNo: current,
      pageSize,
    })
  }

  // 搜索词或者页面变化则重新进行检索
  useEffect(() => {
    const fetchData = async () => {
      setTableLoading(true)
      const res = await fetchUrl('/api/v1/structure/query', {
        title: searchValue,
        pageNo: pageOption.pageNo,
        pageSize: pageOption.pageSize,
        isIncludeHigherTitle: searchCondition.isIncludeHigherTitle,
        titleLevel:
          searchCondition.titleLevel == null ? 0 : searchCondition.titleLevel,
      })
      if (searchValue === '') {
        if (
          res.data?.count >
          LocalStorageManager.getNameSpaceItem(
            'welcomePage',
            'structureTotal',
            0
          )
        ) {
          LocalStorageManager.setNameSpaceItem(
            'welcomePage',
            'structureTotal',
            res.data?.count
          ) // 更新标题观点总数的localStorage
        }
      } else {
        LocalStorageManager.addSearchCount() // 增加搜索次数
      }
      setSearchResult(res.data?.rows)
      setTotal(res.data?.count)
      setTableLoading(false)
    }

    fetchData()
  }, [searchValue, pageOption, searchCondition])

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: '6%',
      render: (text, item, dataIndex: number) => {
        return pageOption.pageSize * (pageOption.pageNo - 1) + dataIndex + 1
      },
    },
    {
      title: '标题',
      dataIndex:
        searchCondition.isIncludeHigherTitle === 'yes'
          ? 'titleExtend'
          : 'title',
      key: 'title',
      ellipsis: false,
      width: '15%',
      render: (text) => {
        if (searchValue) {
          return (
            <SentenceHighlight
              paragraph={text}
              highlightKeys={[...searchValue.split(/\s+/g), '/']}
              isSentenceHighlight={false}
              highlightStyle={{
                sentenceBackgroundColor: '#ffec99',
                wordColor: 'red',
              }}
              isDifferentColor={false}
            />
          )
        }
        return text
      },
    },
    {
      title: '标题级别',
      dataIndex: 'titleLevel',
      key: 'titleLevel',
      ellipsis: false,
      width: '8%',
      render: (text) => {
        let color = '#777'
        if (text === 1) color = '#ff8c00'
        if (text === 2) color = '#4cd137'
        if (text === 3) color = '#9254de'
        if (text === 4) color = '#22a6b3'
        if (text === 9) color = '#c67bdc'
        if (text < 9) {
          return <Tag color={color}>{`${text}级标题`}</Tag>
        } else {
          return <Tag color={color}>{`段落观点`}</Tag>
        }
      },
    },
    {
      title: '文档名称',
      dataIndex: 'documentName',
      key: 'documentName',
      ellipsis: false,
      width: '13%',
      render: (text: string, item: StructureResult) => {
        // 去重后的文档标题列表列表
        const titleList = unique(searchResult.map((d) => d.documentName))
        const colorIndex = Math.max(titleList.indexOf(text), 0)
        console.log(item)
        // 名称有可能是纯字符串，需要在名称前后动态增加书名号
        const docTitle = convertDocTitle(text)
        return (
          <ColorDiv
            key={docTitle}
            url={`/article/${item.paragraph}?searchValue=${searchValue}`}
            colorIndex={colorIndex}
            contentList={[docTitle, item.date]}
          />
        )
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: false,
      width: '38%',
      render: (text: string, item: StructureResult) => {
        // 考虑到有些标题是由2个标题拼凑而来，如果有两个，则使用最好那个标题
        if (item.title) {
          let highlightKeys: string[] = [item.title]
          if (item.title.split('/').length === 2) {
            highlightKeys = [item.title.split('/')[1]]
          }
          return (
            <SentenceHighlight
              paragraph={text.slice(0, 130)}
              highlightKeys={highlightKeys}
              isSentenceHighlight={true}
              highlightStyle={{
                sentenceBackgroundColor: '#ffec99',
                wordColor: '#555',
              }}
              isDifferentColor={false}
            />
          )
        } else {
          return text.slice(0, 130)
        }
      },
    },
  ]

  const { Option } = Select
  return (
    <div className="structure">
      <Affix offsetTop={0}>
        <Row
          justify="center"
          align="middle"
          style={{
            background: '#f0f2f5',
          }}
        >
          <Col span={11}>
            <Space.Compact>
              <Space.Addon>结构检索</Space.Addon>
              <Search
                placeholder="请输入关键词"
                allowClear
                enterButton
                onSearch={() => {
                  setPageOption(defaultPageOption) // 搜索词变化时重置页码
                  setSearchValue(inputValue)
                }}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e?.target?.value)
                  console.log(inputValue)
                }}
              />
            </Space.Compact>
          </Col>
          <Col span={5} style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '16px' }}>标题级别：</span>
            <Select
              style={{
                width: 'calc(100% - 80px)',
                minWidth: '70px',
                maxWidth: '120px',
              }}
              placeholder="级别"
              allowClear
              onChange={(value) => {
                setPageOption(defaultPageOption)
                backToTop()
                if (value) {
                  setSearchCondition({
                    ...searchCondition,
                    titleLevel: value,
                  })
                } else {
                  setSearchCondition({
                    ...searchCondition,
                    titleLevel: null,
                  })
                }
              }}
            >
              {[-1, 9, 1, 2, 3, 4, 5].map((i) => {
                if (i === -1)
                  return (
                    <Option key={i} value={i}>
                      {'文章标题'}
                    </Option>
                  )
                if (i === 9)
                  return (
                    <Option key={i} value={i}>
                      {'段落观点'}
                    </Option>
                  )
                return <Option key={i} value={i}>{`${i}级标题`}</Option>
              })}
            </Select>
          </Col>
          <Col span={5}>
            <span style={{ fontSize: '16px' }}>位置：</span>
            <Select
              style={{
                width: 'calc(100% - 60px)',
                minWidth: '100px',
                maxWidth: '180px',
              }}
              value={searchCondition.isIncludeHigherTitle}
              onChange={(value) => {
                setPageOption(defaultPageOption)
                backToTop()
                setSearchCondition({
                  ...searchCondition,
                  isIncludeHigherTitle: value,
                })
              }}
            >
              <Option key="0" value="no">
                本级标题
              </Option>
              <Option key="1" value="yes">
                本级及上级
              </Option>
            </Select>
          </Col>
        </Row>
      </Affix>
      <SearchHistory
        historyType="structurePage"
        searchValue={searchValue}
        onClickValue={(value) => {
          setSearchValue(value.trim())
          setInputValue(value.trim())
          setPageOption(defaultPageOption)
        }}
      />
      <Spin
        description={`正在检索${
          searchValue === '' ? '...' : '【' + searchValue + '】'
        }`}
        spinning={tableLoading}
      >
        <Table
          style={{ marginTop: '12px' }}
          // 双击打开详情模态框
          onRow={(record) => {
            return {
              onDoubleClick: async () => {
                console.log(record)
                setModalVisible(true)
                setModalLoading(true)
                //   let firstPara: Paragraph = null; // 首段
                //   // 如果文档比较短，则一次性拿到所有段落，拿过之后就存入cache中了，方便下次读取
                //   if (record.paraLength < 200) {
                //     const allParas = await getAllParasByDocumentId(record.id);
                //     if (allParas && allParas.length > 0) {
                //       firstPara = allParas[0];
                //     }
                //   } else {
                //     // 获得文档的首段
                //     firstPara = await getOneParaInDocument(record.id);
                //   }

                setSelectParaId(record.paragraph)
              },
            }
          }}
          // 分页情况
          pagination={{
            defaultCurrent: 1,
            showTotal: () => `共${total}条结果`,
            total,
            current: pageOption.pageNo,
            pageSize: pageOption.pageSize,
          }}
          // 分页跳转的方法
          onChange={async (pagination) => {
            const { current, pageSize } = pagination
            handlePaginationChange(current, pageSize)
            // handlerSorterChange(sorter.field, sorter.order);
            backToTop() // 返回页面顶部
          }}
          rowKey="id"
          columns={columns}
          dataSource={searchResult}
          locale={{ emptyText: `关键词【${searchValue}】未能找到数据！` }}
        />
      </Spin>
      <DetailModal
        isModalVisible={modalVisible} // modal显示情况
        isModalLoading={modalLoading} // 是否模态框显示加载中
        isSentenceHighlight={false} // 不显示高亮句子
        closeModal={() => {
          setModalVisible(false) // 关闭模态框的函数
          setSelectParaId(null) // 清空选中的段落ID
          setModalLoading(false)
        }}
        searchValue={searchValue}
        paraId={selectParaId}
      />
    </div>
  )
}

export default StructurePage
