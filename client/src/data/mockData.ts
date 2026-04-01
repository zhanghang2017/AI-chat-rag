export type HistoryItem = {
  day: "Today" | "Yesterday";
  title: string;
  active?: boolean;
};

export const historyItems: HistoryItem[] = [
  { day: "Today", title: "Neural Network Density Analysis", active: true },
  { day: "Today", title: "RAG Performance Benchmarks" },
  { day: "Yesterday", title: "Quantum Computing Ethics" },
  { day: "Yesterday", title: "Edge AI Optimization" },
];

export const citationChips = [
  { icon: "description", label: "Lab_Notes_Ref_402" },
  { icon: "link", label: "Scaling_Laws_Paper" },
];

export const libraryRows = [
  {
    icon: "description",
    name: "Q3_Financial_Review_Draft.pdf",
    size: "4.2 MB",
    status: "Indexed",
    statusTone: "success" as const,
    added: "2h ago",
  },
  {
    icon: "article",
    name: "System_Architecture.png",
    size: "12.8 MB",
    status: "Processing",
    statusTone: "warning" as const,
    added: "5h ago",
  },
  {
    icon: "description",
    name: "Employee_Handbook_2024.docx",
    size: "1.1 MB",
    status: "Indexed",
    statusTone: "success" as const,
    added: "Yesterday",
  },
];
