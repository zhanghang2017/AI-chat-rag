import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMarkdownProps = {
  content: string;
};

const ChatMarkdown = ({ content }: ChatMarkdownProps) => {
  return (
    <div className="max-w-2xl text-[15px] font-medium leading-relaxed text-black [&_a]:text-sky-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_em]:italic [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:mb-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:list-decimal [&_p]:mb-4 [&_p]:whitespace-pre-wrap [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_tbody_tr]:border-b [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul>li]:list-disc">
      {/* 启用 GitHub Flavored Markdown，让 AI 回复稳定渲染列表、表格和代码块。 */}
      {/* Enable GitHub-flavored markdown so AI replies can render lists, tables, and code blocks consistently. */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

export default ChatMarkdown;