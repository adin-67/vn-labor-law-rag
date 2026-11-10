export type AnswerKind = 'wage' | 'notice' | 'leave' | 'generic';
export type Message = { role: 'user'; text: string } | { role: 'assistant'; kind: AnswerKind };
export interface ConversationOwner { id: string; name: string; email: string }
export interface Thread {
  id: string;
  title: string;
  preview: string;
  date: string;
  messages: Message[];
  owner?: ConversationOwner;
  updatedAt?: string;
}
export interface Profile extends ConversationOwner { occupation: string }
export type TemplateType = 'resignation' | 'leave' | 'application';
export interface Draft {
  name: string; company: string; recipient: string; position: string; department: string;
  date: string; endDate: string; place: string; reason: string; handover: string;
}
export interface Template {
  title: string; fullTitle: string; tag: string; desc: string; type: string; reason: string; note: string;
}
export interface LawDocument {
  id: string; title: string; number: string; type: string;
  status: 'Đã duyệt' | 'Chờ kiểm tra'; date: string; size: string; note: string;
  article?: string; source?: string; structure?: string; versionNote?: string;
}
export interface Feedback { id: string; text: string; type: string; topic: string; date: string }
export interface AppData {
  profile: Profile; threads: Thread[]; docs: LawDocument[];
  drafts: Partial<Record<TemplateType, Draft>>; feedback: Feedback[];
}
export type Dialog =
  | { type: 'citation' | 'google' | 'help' | 'scope' | 'forgot' | 'upload' }
  | { type: 'rename' | 'delete'; id: string }
  | { type: 'feedback'; topic: string };
