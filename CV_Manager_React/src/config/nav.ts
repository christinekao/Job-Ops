import {
  BookOpen,
  Briefcase,
  ClipboardCopy,
  Database,
  FileText,
  Target
} from "lucide-react";
import type { ApplicationStatus } from "../types";

export type TabId =
  | "screening-lab"
  | "setup"
  | "career-source"
  | "source-intake"
  | "truth"
  | "skill-map"
  | "evidence"
  | "star"
  | "inbox"
  | "jd-tailoring"
  | "jd-intake"
  | "workspace"
  | "prompts"
  | "cv-builder"
  | "cv-studio"
  | "cv-editor-export"
  | "export"
  | "recruiter-bank"
  | "analytics"
  | "flow-map";

export const navSections: {
  label: string;
  detail: string;
  items: { id: TabId; label: string; icon: typeof Briefcase }[];
}[] = [
  {
    label: "Opportunities",
    detail: "先選一份職缺，再進入工作流",
    items: [
      { id: "inbox", label: "Opportunities", icon: Briefcase }
    ]
  },
  {
    label: "Apply Workflow",
    detail: "選好 JD 後從分析到送出",
    items: [
      { id: "screening-lab", label: "Screening Lab", icon: Target },
      { id: "cv-builder", label: "CV Edit / Export", icon: FileText },
      { id: "export", label: "Export / Apply", icon: ClipboardCopy }
    ]
  },
  {
    label: "Data",
    detail: "可重用的職涯資料與職缺清單",
    items: [
      { id: "career-source", label: "Career Evidence", icon: Database }
    ]
  },
  {
    label: "Tools",
    detail: "面試回答與求職素材",
    items: [
      { id: "recruiter-bank", label: "Recruiter Bank", icon: BookOpen }
    ]
  },
  {
    label: "System",
    detail: "進階 prompt、檢查與備份",
    items: [
      { id: "prompts", label: "Advanced Prompts", icon: ClipboardCopy },
      { id: "analytics", label: "Overview", icon: Target }
    ]
  }
];

export const statuses: ApplicationStatus[] = [
  "New",
  "Parsed",
  "Evidence Needed",
  "Ready to Tailor",
  "CV Drafted",
  "Reviewed",
  "Applied",
  "Follow-up Needed",
  "Archived"
];
