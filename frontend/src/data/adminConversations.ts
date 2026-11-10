import type { Thread } from '../types';

// Fictional users, visible only in the admin prototype; these are not real users' records.
export const adminDemoThreads: Thread[] = [
  {
    id: 'sample-user-minh-notice',
    owner: { id: 'sample-minh', name: 'Trần Tuấn Minh', email: 'tuanminh@example.com' },
    title: 'Chuẩn bị thông tin trước khi nghỉ việc',
    preview: 'Tôi đang làm theo hợp đồng có thời hạn và muốn tìm hiểu trước khi nghỉ việc.',
    date: '30/10/2026', updatedAt: '2026-10-30T09:15:00+07:00',
    messages: [
      { role: 'user', text: 'Tôi đang làm theo hợp đồng có thời hạn và muốn tìm hiểu trước khi nghỉ việc.' },
      { role: 'assistant', kind: 'notice' },
      { role: 'user', text: 'Tôi đã làm chính thức, hợp đồng có thời hạn 24 tháng. Tôi sẽ chuẩn bị thêm thông tin về ngày nghỉ dự kiến.' },
      { role: 'assistant', kind: 'generic' },
    ],
  },
  {
    id: 'sample-user-thao-leave',
    owner: { id: 'sample-thao', name: 'Lê Phương Thảo', email: 'phuongthao@example.com' },
    title: 'Tìm hiểu nghỉ phép và chuẩn bị đơn',
    preview: 'Tôi muốn tìm quy định nghỉ phép và chuẩn bị đơn xin nghỉ phép.',
    date: '29/10/2026', updatedAt: '2026-10-29T14:30:00+07:00',
    messages: [
      { role: 'user', text: 'Tôi muốn tìm quy định nghỉ phép và chuẩn bị đơn xin nghỉ phép.' },
      { role: 'assistant', kind: 'leave' },
    ],
  },
  {
    id: 'sample-user-minh-wage',
    owner: { id: 'sample-minh', name: 'Trần Tuấn Minh', email: 'tuanminh@example.com' },
    title: 'Đối chiếu tỷ lệ lương thử việc',
    preview: 'Lương công việc 12 triệu đồng, lương thử việc 9 triệu đồng được tính thế nào?',
    date: '28/10/2026', updatedAt: '2026-10-28T16:10:00+07:00',
    messages: [
      { role: 'user', text: 'Lương công việc của tôi là 12 triệu đồng/tháng. Lương thử việc 9 triệu đồng có phù hợp về tỷ lệ không?' },
      { role: 'assistant', kind: 'wage' },
    ],
  },
];
