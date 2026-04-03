import type { ChatMessage } from "../../api";
import ChatMarkdown from "./ChatMarkdown";
import CitationChips from "./CitationChips";

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
  const isAssistant = message.role === "assistant";

  return (
    <div className={isAssistant ? "space-y-4" : "flex flex-col items-end space-y-4"}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isAssistant ? "Cognitive Engine" : "Researcher Request"}
        </span>
      </div>
      <div
        className={isAssistant
          ? ""
          : "max-w-xl rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-800 shadow-sm"
        }
      >
        {isAssistant ? <ChatMarkdown content={message.content} /> : message.content}
      </div>
      {isAssistant && message.sources?.length ? <CitationChips sources={message.sources} /> : null}
    </div>
  );
};

export default ChatMessageBubble;