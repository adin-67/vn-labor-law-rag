import { useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { templates } from '../data/demo';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { Field, PageHeading } from '../components/ui';
import { defaultDraft, documentParagraphs, downloadWord } from '../lib/documents';
import type { Draft, Template, TemplateType } from '../types';

const templateTypes: TemplateType[] = ['resignation','leave','application'];
function MiniPaper({ template }: { template: Template }) {
  return <div className="mini-paper"><div className="mini-heading">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div className="mini-sub">Độc lập – Tự do – Hạnh phúc</div>
    <h3>{template.fullTitle}</h3>{Array.from({length:8},(_,i)=><div key={i} className={`paper-line ${i===1||i===5?'short':''}`} />)}<div className="paper-line tiny" /><div className="paper-seal">✺</div>
  </div>;
}
export function TemplatesPage() {
  return <section className="page"><PageHeading eyebrow="Mỗi bước đều có sự chuẩn bị" title="Một lá đơn, rõ điều muốn nói." subtitle="Chọn mẫu phù hợp. Điền thông tin của bạn. Xem lại trước khi sử dụng." />
    <div className="template-intro"><Icon name="sparkle" />Một khởi đầu gọn gàng cho những thủ tục trong công việc.</div>
    <div className="template-grid">{templateTypes.map((type,i) => {
      const t=templates[type];
      return <article key={type} className="template-card"><div className={`template-preview ${i===1?'warm':i===2?'cool':''}`}><MiniPaper template={t} /></div>
        <div className="template-info"><span className={`tag ${i===1?'copper':i===2?'gray':''}`}>{t.tag}</span><h2>{t.title}</h2><p>{t.desc}</p><Link to={`/templates/${type}`} className={`btn ${i===0?'primary':''}`}>Sử dụng mẫu này <Icon name="arrow" /></Link></div>
      </article>;
    })}</div><p className="subtle-info"><Icon name="info" />Các mẫu hỗ trợ soạn thảo ban đầu. Bạn cần kiểm tra thông tin, điều kiện áp dụng và nội dung trước khi sử dụng.</p>
  </section>;
}
export function TemplateRoute() {
  const { type }=useParams();
  if (!templateTypes.includes(type as TemplateType)) return <Navigate to="/templates" replace />;
  return <TemplateEditor key={type} type={type as TemplateType} />;
}
function TemplateEditor({ type }: { type: TemplateType }) {
  const { data, setData, toast }=useApp();
  const [draft, setDraft]=useState<Draft>(()=>({...defaultDraft(type,data.profile),...data.drafts[type]}));
  const form=useRef<HTMLFormElement>(null);
  const template=templates[type];
  function field(name: keyof Draft, label: string, inputType: 'text'|'textarea'|'date'='text', full=false, required=false) {
    return <Field name={name} label={label} type={inputType} full={full} required={required} value={draft[name]} onChange={value=>setDraft(d=>({...d,[name]:value}))} />;
  }
  function validate() {
    if (!form.current?.reportValidity()) return false;
    if (type==='leave' && draft.endDate < draft.date) {toast('Ngày kết thúc cần từ ngày bắt đầu trở đi.');return false;}
    return true;
  }
  function save() {
    setData(d=>({...d,drafts:{...d.drafts,[type]:draft}}));
    toast('Đã lưu bản nháp trên trình duyệt này.');
  }
  return <section className="page"><Link className="back-link" to="/templates"><Icon name="back" />Tất cả mẫu đơn</Link>
    <PageHeading eyebrow="Viết rõ ràng · Kiểm tra trước khi dùng" title={template.title} subtitle="Thông tin bạn điền sẽ xuất hiện trong bản xem trước." action={<div className="steps"><b>1</b>Điền thông tin<span /><b>2</b>Kiểm tra<span /><b>3</b>Xuất file</div>} />
    <div className="document-layout"><form ref={form} className="card form-card" onSubmit={e=>{e.preventDefault();if(validate()){save();downloadWord(type,draft);toast('Đã xuất file Word. Hãy kiểm tra trước khi sử dụng.');}}}>
      <h2>Thông tin của bạn</h2><span className="text-small text-muted">Những ô có dấu * là thông tin bắt buộc.</span>
      <div className="form-grid">
        {field('name','Họ và tên','text',false,true)}{field('company','Tên công ty','text',false,true)}{field('recipient','Kính gửi','text',true,true)}
        {field('position',type==='application'?'Vị trí ứng tuyển':'Chức danh')}
        {type==='application'?field('place','Địa điểm'):field('department','Bộ phận')}
        {type!=='application' && field('date',type==='leave'?'Ngày bắt đầu nghỉ':'Ngày nghỉ dự kiến','date',type!=='leave',true)}
        {type==='leave' && field('endDate','Ngày kết thúc nghỉ','date',false,true)}
        {field('reason',type==='application'?'Giới thiệu & nguyện vọng':'Lý do','textarea',true,true)}
        {type!=='application' && field('handover','Nội dung bàn giao','textarea',true)}
      </div>
      <button type="button" className="btn ghost small" style={{marginTop:10}} onClick={()=>{setDraft(d=>({...d,reason:template.reason}));toast('Đã điền câu gợi ý mẫu. Đây chưa phải nội dung do AI tạo.');}}><Icon name="sparkle" />Gợi ý diễn đạt mẫu</button>
      <div className="form-divider" /><p className="text-small text-muted">{template.note}</p>
      <div className="form-actions"><button type="button" className="btn" onClick={save}><Icon name="bookmark" />Lưu bản nháp</button><button className="btn primary" type="submit"><Icon name="download" />Tải Word</button></div>
    </form><div className="document-preview-panel"><div className="preview-header"><span><Icon name="eye" />Bản xem trước</span><button type="button" className="btn ghost small" onClick={()=>{if(validate())window.print();}}><Icon name="print" />In / lưu PDF</button></div>
      <article className="document-paper"><DocumentPaper type={type} draft={draft} /></article>
      <p className="subtle-info"><Icon name="shield" />Bạn có thể chỉnh sửa thông tin trước khi tải. Bản nháp được lưu trên trình duyệt này.</p>
    </div></div>
  </section>;
}
function DocumentPaper({ type, draft }: { type: TemplateType; draft: Draft }) {
  return <>
    <div className="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div className="national-subtitle">Độc lập – Tự do – Hạnh phúc</div><div className="national-rule" />
    <h2>{templates[type].fullTitle}</h2>{documentParagraphs(type,draft).map((p,i)=><p key={i}>{p}</p>)}
    <div className="signature"><p>{draft.place || '[Địa điểm]'}, ngày … tháng … năm …</p><b>Người làm đơn</b><div style={{fontSize:11,fontStyle:'italic'}}>(Ký và ghi rõ họ tên)</div><strong>{draft.name || '[Họ và tên]'}</strong></div>
    <p className="doc-footer">MẪU THAM KHẢO · LẠC LUẬT</p>
  </>;
}
