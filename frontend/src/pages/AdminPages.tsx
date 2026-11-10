import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { Field, PageHeading, StatusTag } from '../components/ui';
import type { LawDocument } from '../types';

function StatCard({ title, value, note, icon }: { title: string; value: number; note: string; icon: string }) {
  return <article className="card stat-card"><span>{title}</span><strong>{String(value).padStart(2,'0')}</strong><small>{note}</small><Icon name={icon} /></article>;
}
export function DataPage() {
  const {data,openDialog}=useApp();
  const [search,setSearch]=useState(''), [pending,setPending]=useState(false);
  const docs=data.docs.filter(d=>(!pending||d.status==='Chờ kiểm tra')&&`${d.title} ${d.number}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  return <section className="page"><PageHeading eyebrow="Một nền tảng tốt bắt đầu từ dữ liệu" title="Kho dữ liệu pháp luật." subtitle="Kiểm tra nguồn, cấu trúc và phiên bản trước khi đưa vào sử dụng." action={<button className="btn primary" onClick={()=>openDialog({type:'upload'})}><Icon name="plus" />Thêm tài liệu</button>} />
    <div className="stats-grid"><StatCard title="Tài liệu trong kho" value={data.docs.length} note="Văn bản đã tiếp nhận" icon="database" /><StatCard title="Chờ kiểm tra" value={data.docs.filter(d=>d.status==='Chờ kiểm tra').length} note="Cần đối chiếu nội dung và phiên bản" icon="history" /><StatCard title="Đã duyệt" value={data.docs.filter(d=>d.status==='Đã duyệt').length} note="Sẵn sàng tra cứu" icon="shield" /></div>
    <section className="card table-card"><div className="table-toolbar"><div className="search-field"><Icon name="search" /><input aria-label="Tìm văn bản" placeholder="Tên văn bản hoặc số hiệu…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
      <button className={`filter-chip ${pending?'active':''}`} onClick={()=>setPending(v=>!v)} aria-pressed={pending}><Icon name="filter" />Chờ kiểm tra</button><span>PDF · PDF scan · DOC · DOCX</span>
    </div><div className="table-scroll"><table><thead><tr><th>VĂN BẢN</th><th>ĐỊNH DẠNG</th><th>TRẠNG THÁI</th><th>NGÀY THÊM</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>
      {docs.length?docs.map(d=><tr key={d.id}><td><div className="doc-row-title"><span className={`file-icon ${d.type.includes('PDF')?'pdf':''}`}><Icon name="file" /></span><span><strong>{d.title}</strong><small>{d.number} · {d.note}</small></span></div></td><td>{d.type}</td><td><StatusTag value={d.status} /></td><td>{d.date}</td><td><Link className="btn small" to={`/admin/data/${d.id}`}>Kiểm tra <Icon name="arrow" /></Link></td></tr>)
        :<tr><td colSpan={5} style={{textAlign:'center',padding:35}}>Không tìm thấy tài liệu phù hợp.</td></tr>}
    </tbody></table></div><div className="table-footer"><span>{docs.length} tài liệu</span><span>Trang 01</span></div></section>
  </section>;
}
export function ReviewRoute() {
  const {id}=useParams(); const {data}=useApp();
  const document=data.docs.find(d=>d.id===id);
  return document?<ReviewPage key={id} document={document} />:<Navigate to="/admin/data" replace />;
}
function ReviewPage({document}: {document: LawDocument}) {
  const {setData,openDialog,toast}=useApp();
  const [values,setValues]=useState({
    article:document.article??'Tiền lương của người lao động trong thời gian thử việc do hai bên thỏa thuận nhưng ít nhất phải bằng 85% mức lương của công việc đó.',
    number:document.number,source:document.source??'Cổng Thông tin điện tử Chính phủ',
    structure:document.structure??'Điều không chia khoản',versionNote:document.versionNote??'Cần kiểm tra hiệu lực trước khi sử dụng',
  });
  const [approved,setApproved]=useState(document.status==='Đã duyệt');
  function save(approve=false) {
    setData(data=>({...data,docs:data.docs.map(d=>d.id===document.id?{...d,...values,status:approve?'Đã duyệt':d.status}:d)}));
    if(approve)setApproved(true);
    toast(approve?'Đã cập nhật trạng thái duyệt trong dữ liệu mẫu.':'Đã lưu chỉnh sửa trong dữ liệu mẫu.');
  }
  return <section className="page"><Link className="back-link" to="/admin/data"><Icon name="back" />Quay lại kho dữ liệu</Link>
    <PageHeading eyebrow="Kiểm tra trước khi sử dụng" title="Kiểm tra cấu trúc văn bản." subtitle={`${document.number} · ${document.title}`} action={<StatusTag value={approved?'Đã duyệt':'Chờ kiểm tra'} />} />
    <div className="review-layout"><aside className="card structure-panel"><h3>Cấu trúc tài liệu mẫu</h3><div className="tree-item">Chương III</div><div className="tree-item indent">Hợp đồng lao động</div><div className="tree-item indent">Điều 24. Thử việc</div><div className="tree-item indent">Điều 25. Thời gian thử việc</div><div className="tree-item selected">Điều 26. Tiền lương thử việc</div><div className="tree-item indent">Điều 27. Kết thúc thử việc</div></aside>
      <form className="card review-editor" onSubmit={e=>{e.preventDefault();save();}}>
        <div className="section-head"><span className="tag gray"><Icon name="file" />Nội dung trích xuất minh họa</span><button className="btn small" type="button" onClick={()=>openDialog({type:'citation'})}><Icon name="eye" />Đối chiếu nguồn mẫu</button></div>
        <h2>Điều 26. Tiền lương thử việc</h2>
        <Field name="article" label="Nội dung điều luật" type="textarea" value={values.article} onChange={article=>setValues(v=>({...v,article}))} />
        <div className="metadata-grid"><Field name="number" label="Số hiệu văn bản" value={values.number} required onChange={number=>setValues(v=>({...v,number}))} />
          <Field name="source" label="Nguồn đối chiếu" value={values.source} onChange={source=>setValues(v=>({...v,source}))} />
          <Field name="structure" label="Loại cấu trúc" value={values.structure} onChange={structure=>setValues(v=>({...v,structure}))} />
          <Field name="versionNote" label="Ghi chú phiên bản" value={values.versionNote} onChange={versionNote=>setValues(v=>({...v,versionNote}))} />
        </div><div className="review-callout"><Icon name="info" />Nội dung và cây cấu trúc ở đây là ví dụ giao diện. Tài liệu tải lên chưa được OCR hoặc phân tích tự động trong bản xem trước.</div>
        <div className="form-actions"><button className="btn" type="submit">Lưu chỉnh sửa</button><button className="btn primary" type="button" onClick={e=>{if(e.currentTarget.form?.reportValidity())save(true);}}><Icon name="check" />Duyệt bản mẫu</button></div>
      </form>
    </div>
  </section>;
}
