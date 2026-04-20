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
import {
  Input,
  message,
  Modal,
  Rate,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import type { GetProps } from 'antd'
import SentenceHighlight from '../../components/SentenceHighlight'
import {
  convertDocTitle,
  unique,
  type ResponseData,
  type StructureResult,
} from '../../../utils'
import { fetchUrl } from '../../../utils/network'
import DetailModal from '../../components/DetailModal'
import ColorDiv from '../../components/colorDiv'

type SearchProps = GetProps<typeof Input.Search>
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
      const res = await fetchUrl(
        'http://127.0.0.1:5000/api/v1/structure/query',
        {
          title: searchValue,
          pageNo: pageOption.pageNo,
          pageSize: pageOption.pageSize,
        }
      )
      setSearchResult(res.data?.rows)
      setTotal(res.data?.count)
    }

    fetchData()
  }, [searchValue, pageOption])

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
      dataIndex: 'title',
      key: 'title',
      ellipsis: false,
      width: '15%',
      render: (text) => {
        if (searchValue) {
          return (
            <SentenceHighlight
              paragraph={text}
              highlightKeys={searchValue.split(/\s+/g)}
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
        console.log(text)
        // 名称有可能是纯字符串，需要在名称前后动态增加书名号
        const docTitle = convertDocTitle(text)
        return (
          <ColorDiv
            key={docTitle}
            link={item.filepath}
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

  return (
    <>
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
      <Spin description="正在检索" spinning={tableLoading}>
        <Table
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

                setSelectParaId(record.id)
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

export default StructurePage
