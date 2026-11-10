import { adminDemoThreads } from '../data/adminConversations';
import type { AppData, ConversationOwner, Profile, Thread } from '../types';

export type AdminConversation = Thread & { owner: ConversationOwner; sample: boolean; sortTime: number };

function timestamp(thread: Thread) {
  if (thread.updatedAt) {
    const time = Date.parse(thread.updatedAt);
    if (Number.isFinite(time)) return time;
  }
  const [day, month, year] = thread.date.split('/').map(Number);
  return new Date(year, month - 1, day).getTime() || 0;
}
function ownerFor(thread: Thread, profile: Profile): ConversationOwner {
  // Legacy threads belong to the existing local profile. Its stable ID survives name/email edits.
  if (!thread.owner || thread.owner.id === profile.id) return { id: profile.id, name: profile.name, email: profile.email };
  return thread.owner;
}
export function adminConversations(data: AppData): AdminConversation[] {
  return [
    ...data.threads.map(t => ({ ...t, owner: ownerFor(t, data.profile), sample: false, sortTime: timestamp(t) })),
    ...adminDemoThreads.map(t => ({ ...t, owner: t.owner!, sample: true, sortTime: timestamp(t) })),
  ].sort((a,b) => b.sortTime - a.sortTime);
}
export function conversationDate(thread: Thread) {
  return thread.updatedAt ? new Date(thread.updatedAt).toLocaleString('vi-VN', {
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit',
  }) : thread.date;
}
