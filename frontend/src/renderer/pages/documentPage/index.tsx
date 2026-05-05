/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react'
import {
  AudioOutlined,
  FileMarkdownTwoTone,
  FilePdfTwoTone,
  FileTextTwoTone,
  FileTwoTone,
  FileWordTwoTone,
} from '@ant-design/icons'
import { Input, message, Modal, Rate, Space, Spin, Table, Tooltip } from 'antd'
import type { GetProps } from 'antd'
import SentenceHighlight from '../../components/SentenceHighlight'
import type { Paragraph, ResponseData } from '../../../utils'
import {
  fetchUrl,
  getAllParasByDocumentId,
  getDocumentById,
  getOneParaByDocumentId,
  getOutlineJsonByDocumentId,
  getParagraphById,
  getSomeParas,
} from '../../../utils/network'
import DetailModal from '../../components/DetailModal'
import LocalStorageManager from '../../../utils/localStorage'
import SearchHistory from '../../components/SearchHistory'

type SearchProps = GetProps<typeof Input.Search>
const { Search } = Input

const DocumentsPage: React.FC = () => {
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

  // 处理分页变换
  const handlePaginationChange = (current, pageSize) => {
    setPageOption({
      pageNo: current,
      pageSize,
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      setTableLoading(true)
      const res = await fetchUrl('/api/v1/document/query', {
        title: searchValue,
        pageNo: pageOption.pageNo,
        pageSize: pageOption.pageSize,
      })
      if (searchValue === '') {
        LocalStorageManager.setNameSpaceItem(
          'welcomePage',
          'documentTotal',
          res.data?.count || 0
        ) // 更新文档总数的localStorage
      } else {
        LocalStorageManager.addSearchCount() // 增加搜索次数
      }
      setSearchResult(res.data?.rows)
      setTotal(res.data?.count)
      setTableLoading(false)
    }

    fetchData()
  }, [searchValue, pageOption])

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      ellipsis: false,
      width: '4%',
      render: (text, item, dataIndex) => {
        return pageOption.pageSize * (pageOption.pageNo - 1) + dataIndex + 1
      },
    },
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: false,
      width: '38%',
      render: (text) => {
        if (searchValue) {
          return (
            <SentenceHighlight
              isDifferentColor={false}
              paragraph={text}
              highlightKeys={searchValue.split(/\s+/g)}
              isSentenceHighlight={false}
              highlightStyle={{
                wordColor: 'red',
                sentenceBackgroundColor: '#fff',
              }}
            />
          )
        } else {
          return text
        }
      },
    },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      ellipsis: false,
      width: '8%',
      render: (text, item) => {
        const typeIconMap = {
          pdf: <FilePdfTwoTone twoToneColor="#52c41a" />,
          doc: <FileWordTwoTone twoToneColor="#13c2c2" />,
          epub: <FileMarkdownTwoTone twoToneColor="#2f54eb" />,
          txt: <FileTextTwoTone twoToneColor="#722ed1" />,
          json: <FileTwoTone twoToneColor="#eb2f96" />,
        }

        if (typeIconMap[text]) {
          const tipTitle = '双击新窗口打开'
          return (
            <Tooltip title={tipTitle}>
              <div
                style={{ cursor: 'pointer' }}
                onDoubleClick={async (evt) => {
                  evt.stopPropagation() // 如果传入链接, 则阻止冒泡，否则会访问父元素方法导致打开详情页
                  const firstPara = await getOneParaByDocumentId(item.id)
                  window.open(
                    `/article/${firstPara.id}?searchValue=${searchValue}`,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }}
              >
                {typeIconMap[text]}
                {text}
              </div>
            </Tooltip>
          )
        }
        return text
      },
    },
    {
      title: '段落总数',
      dataIndex: 'paraLength',
      key: 'paraLength',
      ellipsis: false,
      width: '10%',
      sorter: true,
      render: (text) => {
        return `${text}段`
      },
    },
    {
      title: '文档日期',
      dataIndex: 'date',
      key: 'date',
      ellipsis: false,
      width: '10%',
      sorter: true,
      render: (text) => {
        return `${text.slice(0, 10)}`
      },
    },
    {
      title: '收藏',
      dataIndex: 'star',
      key: 'star',
      ellipsis: false,
      width: '8%',
      sorter: true,
      render: (text, item) => {
        return (
          <Rate
            onChange={async (value) => {
              const starDocId = item.id // 改变收藏的文档ID
              const newSearchData = [] // 新的表格数据
              //   for (let i = 0; i < searchResult.length; i++) {
              //     const item = searchResult[i];
              //     if (item.id === starDocId) {
              //       newSearchData.push({ ...item, star: value });
              //     } else {
              //       newSearchData.push({ ...item });
              //     }
              //   }
              //   // 获取第一段
              //   const firstPara = await getFirstParaInDocument(item.id);
              //   // 增加历史记录，其中isStar必须为真
              //   addDetailHistory({
              //     documentName: item.title,
              //     content: firstPara.content,
              //     date: item.date,
              //     documentId: item.id,
              //     paraId: firstPara.id,
              //     filepath: item.filePath,
              //     source: '文档管理',
              //     searchValue: searchValue,
              //     isStar: value === 1,
              //     fileSource: 'document',
              //   });

              //   setSearchResult(newSearchData); // 乐观更新
              //   await changeStarByDocId(item.id, value); // 更新对应的文档
            }}
            value={item.star}
            count={1}
          />
        )
      },
    },
  ]

  return (
    <>
      <Space.Compact>
        <Space.Addon>文档检索</Space.Addon>
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
      <SearchHistory
        historyType="documentPage"
        searchValue={searchValue}
        onClickValue={(value) => {
          setSearchValue(value.trim())
          setInputValue(value.trim())
          setPageOption(defaultPageOption)
        }}
      />
      <Spin description="正在检索" spinning={tableLoading}>
        <Table
          // 双击打开详情模态框
          onRow={(record) => {
            return {
              onDoubleClick: async () => {
                console.log(record)
                setModalVisible(true)
                setModalLoading(true)
                let firstPara: Paragraph = null // 首段
                // 如果文档比较短，则一次性拿到所有段落，拿过之后就存入cache中了，方便下次读取
                if (record.paraLength < 200) {
                  const allParas = await getAllParasByDocumentId(record.id)
                  if (allParas && allParas.length > 0) {
                    firstPara = allParas[0]
                  }
                } else {
                  // 获得文档的首段
                  firstPara = await getOneParaByDocumentId(record.id)
                }

                setSelectParaId(firstPara?.id)
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
          onChange={async (pagination, filters, sorter) => {
            const { current, pageSize } = pagination
            handlePaginationChange(current, pageSize)
            // handlerSorterChange(sorter.field, sorter.order);
            // backToTop(); // 返回页面顶部
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
    </>
  )
}

export default DocumentsPage
