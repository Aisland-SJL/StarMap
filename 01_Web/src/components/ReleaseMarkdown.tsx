import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type ReleaseMarkdownProps = {
  source: string
}

export default function ReleaseMarkdown({ source }: ReleaseMarkdownProps) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
}
