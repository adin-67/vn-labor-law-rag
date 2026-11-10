import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { demoDocs, demoThreads } from '../data/demo';
import type { AppData, AnswerKind, Dialog, Message } from '../types';

// Separate key: the original HTML prototype's localStorage is never modified.
export const STORAGE_KEY = 'lac-luat-react-ts-v1';

function initialData(): AppData {
  const fallback: AppData = {
    profile: { id: 'local-member', name: 'Nguyễn Minh Anh', email: 'minhanh@example.com', occupation: 'Người lao động' },
    threads: structuredClone(demoThreads), docs: structuredClone(demoDocs), drafts: {}, feedback: [],
  };
  try {
    const saved: AppData = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved.profile?.name === 'string' && typeof saved.profile.email === 'string'
      && typeof saved.profile.occupation === 'string' && Array.isArray(saved.threads)
      && saved.threads.every(t => typeof t.id === 'string' && typeof t.title === 'string'
        && typeof t.preview === 'string' && Array.isArray(t.messages)
        && t.messages.every(m => m.role === 'user' ? typeof m.text === 'string'
          : m.role === 'assistant' && ['wage','notice','leave','generic'].includes(m.kind)))
      && Array.isArray(saved.docs) && saved.docs.every(d => typeof d.id === 'string' && typeof d.title === 'string')
      && saved.drafts && Array.isArray(saved.feedback)) return {
        ...saved,
        profile: { ...saved.profile, id: typeof saved.profile.id === 'string' ? saved.profile.id : 'local-member' },
      };
  } catch { /* Invalid local data falls back to fixtures, without touching the HTML version. */ }
  return fallback;
}

interface AppContextValue {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  dialog: Dialog | null;
  openDialog: (dialog: Dialog) => void;
  closeDialog: () => void;
  toast: (message: string) => void;
  pendingThreadId: string | null;
  sendMessage: (text: string, existingId?: string) => string | undefined;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notification, setNotification] = useState('');
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busy = useRef(false);
  const closeDialog = useCallback(() => setDialog(null), []);
  const toast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setNotification(message);
    toastTimer.current = setTimeout(() => setNotification(''), 3400);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { toast('Không thể lưu dữ liệu trên trình duyệt này. Dữ liệu hiện vẫn dùng được trong phiên mở.'); }
  }, [data, toast]);
  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(replyTimer.current);
  }, []);

  function sendMessage(raw: string, existingId?: string) {
    const text = raw.trim();
    if (!text || busy.current) return;
    busy.current = true;
    const exists = data.threads.some(t => t.id === existingId);
    const id = exists && existingId ? existingId : `t-${crypto.randomUUID()}`;
    const userMessage: Message = { role: 'user', text };
    setData(current => ({ ...current, threads: exists
      ? current.threads.map(t => t.id === id ? { ...t, updatedAt: new Date().toISOString(), messages: [...t.messages, userMessage] } : t)
      : [{ id, title: text.length > 45 ? `${text.slice(0,45)}…` : text,
        preview: text, date: new Date().toLocaleDateString('vi-VN'), updatedAt: new Date().toISOString(),
        owner: { id: data.profile.id, name: data.profile.name, email: data.profile.email },
        messages: [userMessage] }, ...current.threads] }));
    setPendingThreadId(id);
    replyTimer.current = setTimeout(() => {
      // Deliberate mock response; this is the replaceable future AI integration boundary.
      const kind: AnswerKind = /lương|triệu|85%/i.test(text) ? 'wage'
        : /nghỉ việc|báo trước|hợp đồng/i.test(text) ? 'notice'
        : /nghỉ phép|ngày nghỉ/i.test(text) ? 'leave' : 'generic';
      setData(current => ({ ...current, threads: current.threads.map(t => t.id === id
        ? { ...t, updatedAt: new Date().toISOString(), messages: [...t.messages, { role: 'assistant', kind }] } : t) }));
      busy.current = false;
      setPendingThreadId(null);
    }, 650);
    return id;
  }

  return <AppContext.Provider value={{ data, setData, dialog, openDialog: setDialog, closeDialog, toast, pendingThreadId, sendMessage }}>
    {children}
    <div id="toast" role="status" aria-live="polite" className={notification ? 'visible' : ''}>{notification}</div>
  </AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
