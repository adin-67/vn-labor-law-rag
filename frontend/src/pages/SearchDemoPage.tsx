import {useEffect, useRef, useState} from 'react';
import {getSource, searchSources} from '../services/api';
import type {SearchResponse, SourceResponse} from '../services/api';
import '../styles/search-demo.css';

export function SearchDemoPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [source, setSource] = useState<SourceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceError, setSourceError] = useState('');
  const searchController = useRef<AbortController | null>(null);
  const sourceController = useRef<AbortController | null>(null);
  const sourceDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => () => {
    searchController.current?.abort();
    sourceController.current?.abort();
  }, []);

  async function search() {
    const text = query.trim();
    if (!text) {setError('Bạn cần nhập câu hỏi.');return;}
    searchController.current?.abort();
    sourceController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setLoading(true);setError('');setData(null);setSource(null);setSourceError('');setSourceLoading(false);
    try {setData(await searchSources(text, controller.signal));}
    catch (failure) {if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Tìm kiếm thất bại.');}
    finally {if (searchController.current === controller) setLoading(false);}
  }

  async function openSource(unitId: string) {
    const dialog = sourceDialog.current;
    if (!data || !dialog || dialog.open) return;
    sourceController.current?.abort();
    const controller = new AbortController();
    sourceController.current = controller;
    setSourceLoading(true);
    setSourceError('');
    setSource(null);
    dialog.showModal();
    try {
      const result = await getSource(unitId, controller.signal);
      if (result.snapshot_id !== data.snapshot_id || result.mode !== data.mode) {
        throw new Error('Dữ liệu nguồn đã thay đổi. Hãy tìm kiếm lại để mở đúng phiên bản.');
      }
      if (!controller.signal.aborted) setSource(result);
    }
    catch (failure) {
      if (!controller.signal.aborted) {
        setSourceError(failure instanceof Error ? failure.message : 'Không mở được nguồn.');
      }
    }
    finally {
      if (sourceController.current === controller) setSourceLoading(false);
    }
  }

  return <section className="integration-demo">
    <p className="integration-demo__eyebrow">LẠC LUẬT · BẢN THỬ NGHIỆM</p>
    <h1>Tìm điều luật</h1>
    <p>Tìm theo từ khóa trong bộ dữ liệu thử nghiệm về thử việc và mở văn bản để đối chiếu. Hãy nhập tiếng Việt có dấu.</p>
    <form onSubmit={event => {event.preventDefault();void search();}}>
      <label htmlFor="api-query">Câu hỏi tìm kiếm</label>
      <textarea id="api-query" value={query} onChange={event => setQuery(event.target.value)} maxLength={3000}
        placeholder="Thử việc bao nhiêu ngày?" rows={3}/>
      <button type="submit" disabled={loading}>{loading ? 'Đang tìm…' : 'Tìm nguồn'}</button>
    </form>
    {error && <p className="integration-demo__error" role="alert">{error}</p>}
    <div aria-live="polite">
      {loading && <p role="status">Đang chờ API trả kết quả…</p>}
      {data && <>
        <p className="integration-demo__mode">{data.mode === 'mock' ? 'DỮ LIỆU GIẢ LẬP · chỉ kiểm tra kết nối' : 'BM25 · Dữ liệu thử nghiệm Điều 24–27, bản gốc 2019'}</p>
        <p>Kết quả cho: <strong>{data.query}</strong></p>
        {data.results.length === 0 ? <p>Không tìm thấy đoạn phù hợp. Bạn có thể đổi câu hỏi.</p>
          : <ul className="integration-demo__results">{data.results.map(item => <li key={item.unit_id}>
            <h2>{item.title}</h2><p>{item.text.slice(0,160)}{item.text.length > 160 ? '…' : ''}</p>
            {item.page_from !== null && <small>Trang PDF {item.page_from}{item.page_to !== null && item.page_to !== item.page_from ? `–${item.page_to}` : ''}</small>}
            <button type="button" aria-haspopup="dialog" onClick={() => void openSource(item.unit_id)}>Mở nguồn</button>
          </li>)}</ul>}
      </>}
    </div>
    <dialog ref={sourceDialog} className="integration-demo__source" aria-labelledby="search-source-title"
      onClose={() => sourceController.current?.abort()}>
      <header className="integration-demo__source-header">
        <h2 id="search-source-title">{source?.source.title ?? 'Nội dung nguồn'}</h2>
        <button type="button" onClick={() => sourceDialog.current?.close()}>Đóng</button>
      </header>
      {sourceLoading && <p role="status">Đang mở nguồn…</p>}
      {sourceError && <p className="integration-demo__error" role="alert">{sourceError}</p>}
      {source && <div>
        {source.mode === 'mock' && <p><strong>Đây là bản ghi kỹ thuật giả lập, không phải điều luật.</strong></p>}
        <p>{source.source.document_id} · Phiên bản: {source.source.version_id}</p>
        <p className="integration-demo__original">{source.source.text}</p>
        <p>{source.source.page_from === null ? 'Chưa có vị trí trang đã xác nhận.' : `Trang PDF ${source.source.page_from}${source.source.page_to && source.source.page_to !== source.source.page_from ? `–${source.source.page_to}` : ''}`}</p>
        {source.source.source_url && /^https?:\/\//i.test(source.source.source_url)
          && <a href={source.source.source_url} target="_blank" rel="noopener noreferrer">Mở văn bản gốc trong tab mới</a>}
      </div>}
    </dialog>
  </section>;
}
