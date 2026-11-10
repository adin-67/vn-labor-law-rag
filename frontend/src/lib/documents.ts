import { templates } from '../data/demo';
import type { Draft, Profile, TemplateType } from '../types';

export function defaultDraft(type: TemplateType, profile: Profile): Draft {
  return { name: profile.name, company: 'Công ty TNHH An Hòa', recipient: 'Ban Giám đốc và Phòng Nhân sự',
    position: type === 'application' ? 'Lập trình viên' : 'Nhân viên phát triển phần mềm', department: 'Phòng Công nghệ',
    date: '2026-11-30', endDate: '2026-12-02', place: 'TP. Hồ Chí Minh', reason: templates[type].reason,
    handover: 'Tôi sẽ phối hợp bàn giao công việc và tài liệu liên quan theo thống nhất với công ty.' };
}
function dateText(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '[ngày dự kiến]';
  const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`;
}
export function documentParagraphs(type: TemplateType, draft: Draft) {
  const val = (key: keyof Draft, fallback: string) => draft[key].trim() || `[${fallback}]`;
  const paras = [`Kính gửi: ${val('recipient','Người nhận')}`, `Tôi tên là: ${val('name','Họ và tên')}`];
  if (type === 'application') {
    paras.push(`Qua tìm hiểu, tôi được biết ${val('company','Tên công ty')} đang có nhu cầu tuyển dụng vị trí ${val('position','Vị trí ứng tuyển')}.`,
      `Nguyện vọng và thông tin giới thiệu: ${val('reason','Nội dung giới thiệu')}`,
      'Tôi mong có cơ hội trao đổi thêm về sự phù hợp của mình với vị trí ứng tuyển. Tôi cam kết những thông tin cung cấp là đúng sự thật.');
  } else {
    paras.push(`Hiện đang làm việc tại: ${val('company','Tên công ty')}`, `Chức danh: ${val('position','Chức danh')} — Bộ phận: ${val('department','Bộ phận')}`,
      type === 'leave' ? `Tôi đề nghị được nghỉ phép từ ngày ${dateText(draft.date)} đến hết ngày ${dateText(draft.endDate)}.`
        : `Tôi kính đề nghị công ty xem xét, trao đổi và thống nhất việc chấm dứt hợp đồng lao động, với ngày nghỉ dự kiến là ${dateText(draft.date)}.`,
      `Lý do: ${val('reason','Lý do')}`, val('handover','Nội dung bàn giao'));
  }
  paras.push('Tôi xin chân thành cảm ơn!'); return paras;
}
const xml = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const u16 = (n: number) => [n & 255, (n >>> 8) & 255];
const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) {c ^= b;for (let k=0;k<8;k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);}
  return (c ^ 0xffffffff) >>> 0;
}
// A real OOXML archive, not HTML renamed to .docx. No external upload is involved.
function zipStore(files: Record<string,string>) {
  const encoder = new TextEncoder();
  const parts: Uint8Array<ArrayBuffer>[] = [], central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const [filename,text] of Object.entries(files)) {
    const n=encoder.encode(filename), b=encoder.encode(text), crc=crc32(b);
    const header=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(b.length),...u32(b.length),...u16(n.length),...u16(0)]);
    parts.push(header,n,b);
    central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(b.length),...u32(b.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]),n);
    offset += header.length+n.length+b.length;
  }
  const size=central.reduce((sum,b)=>sum+b.length,0), count=Object.keys(files).length;
  return new Blob([...parts,...central,new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(count),...u16(count),...u32(size),...u32(offset),...u16(0)])],
    {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
export function wordBlob(type: TemplateType, draft: Draft) {
  const para = (text: string, align='both', bold=false, size=26) => `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="150" w:line="320" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>${bold?'<w:b/>':''}<w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
  const body=para('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM','center',true,24)+para('Độc lập – Tự do – Hạnh phúc','center',true,24)+para('','center')
    +para(templates[type].fullTitle,'center',true,30)+documentParagraphs(type,draft).map(p=>para(p)).join('')
    +para(`${draft.place || '[Địa điểm]'}, ngày … tháng … năm …`,'right')+para('Người làm đơn','right',true)+para('(Ký và ghi rõ họ tên)','right')
    +para('','right')+para(draft.name || '[Họ và tên]','right',true)+para('Mẫu tham khảo · Lạc Luật','left',false,18);
  return zipStore({
    '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1417"/></w:sectPr></w:body></w:document>`,
  });
}
export function downloadWord(type: TemplateType, draft: Draft) {
  const a=document.createElement('a'), url=URL.createObjectURL(wordBlob(type,draft));
  a.href=url;
  a.download=`${type==='resignation'?'Don_nghi_viec':type==='leave'?'Don_nghi_phep':'Don_xin_viec'}_LacLuat.docx`;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
