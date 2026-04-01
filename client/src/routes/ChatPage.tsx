import ChatHistoryDrawer from "../components/ChatHistoryDrawer";
import LeftSidebar from "../components/LeftSidebar";
import MaterialIcon from "../components/MaterialIcon";
import TopHeader from "../components/TopHeader";
import { citationChips } from "../data/mockData";

const ChatPage = () => {
  return (
    <div className="bg-white font-sans text-[#191c1e]">
      <TopHeader active="chat" />
      <div className="flex h-screen overflow-hidden pt-16">
        <LeftSidebar active="chat" />
        <main className="relative ml-64 flex min-w-0 flex-1 flex-col bg-white">
          <section className="no-scrollbar flex-1 overflow-y-auto pb-32 pt-8">
            <div className="mx-auto max-w-3xl space-y-10 px-6 md:px-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cognitive Engine
                  </span>
                </div>
                <div className="max-w-2xl text-[15px] font-medium leading-relaxed text-black">
                  How can I assist your research today? I have access to your synchronized
                  Knowledge Base and recent lab data.
                </div>
              </div>

              <div className="flex flex-col items-end space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Researcher Request
                  </span>
                </div>
                <div className="max-w-xl rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-800 shadow-sm">
                  Analyze the correlation between neural network density and emergent reasoning
                  capabilities in the latest benchmarks.
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Processing Insights
                  </span>
                </div>
                <div className="space-y-6">
                  <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-black">
                    Recent data suggests a non-linear scaling law. Emergence typically occurs at a
                    specific parameter threshold relative to token density.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {citationChips.map((chip) => (
                      <span
                        key={chip.label}
                        className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-600"
                      >
                        <MaterialIcon name={chip.icon} className="!text-[14px]" />
                        {chip.label}
                      </span>
                    ))}
                  </div>
                  <div className="max-w-2xl rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <MaterialIcon name="auto_awesome" className="!text-sm text-slate-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Retrieved Source Fragment
                      </span>
                    </div>
                    <p className="text-sm italic leading-relaxed text-slate-500">
                      "The inflection point for abstract reasoning tasks was observed specifically when
                      the model density reached 1.2e12 synaptic weights, provided the training data
                      contained greater than 40% structured logic proofs..."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-8">
            <div className="pointer-events-auto mx-auto max-w-3xl">
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white p-1.5 pl-4 shadow-sm transition-all focus-within:ring-1 focus-within:ring-black">
                <textarea
                  rows={1}
                  placeholder="Ask the architect..."
                  className="no-scrollbar h-[42px] flex-1 resize-none border-none bg-transparent px-0 py-2.5 text-sm focus:ring-0"
                ></textarea>
                <button className="flex items-center justify-center rounded-lg bg-black p-2 text-white transition-transform active:scale-95">
                  <MaterialIcon name="send" className="!text-[18px]" />
                </button>
              </div>
              <div className="mt-4 flex justify-center gap-6 opacity-40">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  GPT-4 Turbo Enhanced
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  End-to-End Encrypted
                </span>
              </div>
            </div>
          </div>
        </main>

        <ChatHistoryDrawer />
      </div>
    </div>
  );
};

export default ChatPage;
