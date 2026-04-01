/*
 * @Editor: zhanghang
 * @Description: 
 * @Date: 2026-04-01 14:55:00
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-01 18:00:26
 */
import MaterialIcon from "./MaterialIcon";

export type IngestionToastTone = "info" | "success" | "error";

export type IngestionToastItem = {
  id: string;
  fileId: string;
  title: string;
  description: string;
  tone: IngestionToastTone;
  label: string;
};

type IngestionToastStackProps = {
  toasts: IngestionToastItem[];
  onDismiss: (toastId: string) => void;
};

const toneStyles: Record<IngestionToastTone, {
  icon: string;
  iconClassName: string;
  badgeClassName: string;
}> = {
  info: {
    icon: "sync",
    iconClassName: "bg-[#f2eadf] text-[#7b5d33]",
    badgeClassName: "bg-[#f5ede2] text-[#7b5d33]",
  },
  success: {
    icon: "check_circle",
    iconClassName: "bg-[#e7f5ec] text-[#257a4d]",
    badgeClassName: "bg-[#edf8f1] text-[#257a4d]",
  },
  error: {
    icon: "error",
    iconClassName: "bg-[#fdecec] text-[#b44545]",
    badgeClassName: "bg-[#fff0f0] text-[#b44545]",
  },
};

const IngestionToastStack = ({ toasts, onDismiss }: IngestionToastStackProps) => {
  if (toasts.length === 0) {
    return null;
  }
  console.log('toasts',toasts)

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(100%-2rem,24rem)] flex-col gap-3 md:bottom-8 md:right-8">
      {toasts.map((toast) => {
        const tone = toneStyles[toast.tone];

        return (
          <section
            key={toast.id}
            className="toast-slide-in pointer-events-auto relative overflow-hidden rounded-[28px] border border-[#e8e0d4] bg-[rgba(255,251,245,0.96)] p-4 text-[#1f1b16] shadow-[0_22px_70px_rgba(45,33,20,0.14)] backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(190,154,93,0.16),_transparent_42%)]" />
            <div className="relative flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone.iconClassName}`}>
                <MaterialIcon
                  name={tone.icon}
                  className={toast.tone === "info" ? "toast-spin !text-[1.35rem]" : "!text-[1.35rem]"}
                  filled={toast.tone !== "info"}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8c7761]">
                    Knowledge Base
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${tone.badgeClassName}`}>
                    {toast.label}
                  </span>
                </div>

                <h3 className="font-headline text-[1rem] font-bold leading-5 text-[#211b15]">
                  {toast.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-5 text-[#6f6252]">
                  {toast.description}
                </p>
              </div>

              <button
                type="button"
                className="rounded-full p-1.5 text-[#a18f7d] transition-colors hover:bg-white/70 hover:text-[#3a3129]"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <MaterialIcon name="close" className="!text-[1rem]" />
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default IngestionToastStack;