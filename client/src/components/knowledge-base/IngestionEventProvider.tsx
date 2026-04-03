
/*
 * @Editor: zhanghang
 * @Description:
 * @Date: 2026-04-01 15:07:24
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-01 15:07:30
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { createKnowledgeBaseEventSource, type IngestionStreamEvent } from "../../api";
import { getOrCreateUserId } from "../../workservice/uploadWorkservice";
import IngestionToastStack, { type IngestionToastItem } from "./IngestionToastStack";

const TOAST_DURATION_MS = 5600;

type IngestionToastStage = "started" | "success" | "failed";

type IngestionEventsContextValue = {
  latestEvent: IngestionStreamEvent | null;
};

const IngestionEventsContext = createContext<IngestionEventsContextValue | null>(null);

function getToastStage(event: IngestionStreamEvent): IngestionToastStage | null {
  if (event.type !== "ingestion.updated" || !event.file) {
    return null;
  }

  if (
    (event.file.parseStatus === "pending" || event.file.parseStatus === "processing")
    && (event.task?.status === "queued" || event.task?.status === "running")
  ) {
    return "started";
  }

  if (event.file.parseStatus === "indexed") {
    return "success";
  }

  if (event.file.parseStatus === "failed") {
    return "failed";
  }

  return null;
}

function buildIngestionToast(event: IngestionStreamEvent): IngestionToastItem | null {
  if (event.type !== "ingestion.updated" || !event.file) {
    return null;
  }

  const file = event.file;

  if (
    (file.parseStatus === "pending" || file.parseStatus === "processing")
    && (event.task?.status === "queued" || event.task?.status === "running")
  ) {
    return {
      id: file.id,
      fileId: file.id,
      title: "Indexing started",
      description: `${file.fileName} is being parsed and added to the knowledge base.`,
      tone: "info",
      label: "Started",
    };
  }

  if (file.parseStatus === "indexed") {
    return {
      id: file.id,
      fileId: file.id,
      title: "File indexed",
      description: `${file.fileName} is ready for retrieval and chat context.`,
      tone: "success",
      label: "Success",
    };
  }

  if (file.parseStatus === "failed") {
    return {
      id: file.id,
      fileId: file.id,
      title: "Indexing failed",
      description: event.task?.errorMessage || `${file.fileName} could not be added to the knowledge base.`,
      tone: "error",
      label: "Failed",
    };
  }

  return null;
}

export function IngestionEventProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<IngestionToastItem[]>([]);
  const [latestEvent, setLatestEvent] = useState<IngestionStreamEvent | null>(null);
  const notifiedStatusRef = useRef(new Map<string, string>());
  const toastTimeoutsRef = useRef(new Map<string, number>());

  function dismissToast(toastId: string) {
    const timeoutId = toastTimeoutsRef.current.get(toastId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(toastId);
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }

  function showToast(toast: IngestionToastItem) {
    const existingTimeout = toastTimeoutsRef.current.get(toast.id);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    setToasts((current) => {
      const next = current.filter((item) => item.id !== toast.id);
      return [toast, ...next].slice(0, 4);
    });

    const timeoutId = window.setTimeout(() => {
      dismissToast(toast.id);
    }, TOAST_DURATION_MS);

    toastTimeoutsRef.current.set(toast.id, timeoutId);
  }

  useEffect(() => {
    const source = createKnowledgeBaseEventSource(getOrCreateUserId());

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as IngestionStreamEvent;
        setLatestEvent(payload);

        const nextToastStage = getToastStage(payload);
        if (!nextToastStage || !payload.file) {
          return;
        }

        const lastNotifiedStage = notifiedStatusRef.current.get(payload.file.id);
        if (lastNotifiedStage === nextToastStage) {
          return;
        }

        notifiedStatusRef.current.set(payload.file.id, nextToastStage);

        const toast = buildIngestionToast(payload);
        if (!toast) {
          return;
        }

        showToast(toast);
      } catch {
        // Ignore malformed SSE payloads.
      }
    };

    return () => {
      source.close();
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of toastTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }

      toastTimeoutsRef.current.clear();
    };
  }, []);

  const contextValue = useMemo<IngestionEventsContextValue>(() => ({
    latestEvent,
  }), [latestEvent]);

  return (
    <IngestionEventsContext.Provider value={contextValue}>
      {children}
      <IngestionToastStack toasts={toasts} onDismiss={dismissToast} />
    </IngestionEventsContext.Provider>
  );
}

export function useIngestionEvents() {
  const context = useContext(IngestionEventsContext);
  if (!context) {
    throw new Error("useIngestionEvents must be used within IngestionEventProvider");
  }

  return context;
}