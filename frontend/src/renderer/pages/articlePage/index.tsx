import { Button } from 'antd'
import type React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const ArticlePage: React.FC = () => {
  const { paraId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const keywords = searchParams.get('keywords')

  return (
    <>
      <h1 style={{ textAlign: 'center', marginTop: '20px' }}>
        当前传入的值是{paraId}, 关键词是{keywords}, 敬请期待
      </h1>
      <Button
        onClick={() => {
          setSearchParams({
            keywords: '新的 关键词',
          })
        }}
      >
        设置searchParams
      </Button>
    </>
  )
}

export default ArticlePage
