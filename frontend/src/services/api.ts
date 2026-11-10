export interface Source {
  unit_id: string;
  document_id: string;
  version_id: string;
  title: string;
  article: string | null;
  clause: string | null;
  point: string | null;
  text: string;
  page_from: number | null;
  page_to: number | null;
  source_url: string | null;
}

export interface SearchResponse {
  mode: 'mock' | 'b';
  snapshot_id: string;
  status: 'ok' | 'no_results';
  query: string;
  results: Source[];
}

export interface SourceResponse {
  mode: 'mock' | 'b';
  snapshot_id: string;
  source: Source;
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const nullableString = (value: unknown) => value === null || typeof value === 'string';
const nullablePage = (value: unknown) => value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 1);

function isSource(value: unknown): value is Source {
  if (!record(value)) return false;
  return ['unit_id','document_id','version_id','title','text'].every(key => typeof value[key] === 'string' && value[key].length > 0)
    && ['article','clause','point','source_url'].every(key => nullableString(value[key]))
    && nullablePage(value.page_from) && nullablePage(value.page_to);
}

function validMeta(value: Record<string, unknown>) {
  return (value.mode === 'mock' || value.mode === 'b') && typeof value.snapshot_id === 'string';
}

async function request(path: string, init: RequestInit, signal: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(20_000);
  let response: Response;
  try {
    response = await fetch(baseUrl + path, { ...init, signal: AbortSignal.any([signal, timeout]) });
  } catch (error) {
    if (signal.aborted) throw error;
    if (timeout.aborted) throw new Error('API xử lý quá 20 giây. Bạn có thể thử lại.');
    throw new Error('Không kết nối được API. Kiểm tra backend đang chạy và cấu hình CORS.');
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (record(payload) && record(payload.detail) && typeof payload.detail.message === 'string') {
      throw new Error(payload.detail.message);
    }
    if (response.status === 422) throw new Error('Câu hỏi hoặc tham số chưa hợp lệ.');
    throw new Error(`API trả lỗi ${response.status}.`);
  }
  return payload;
}

export async function searchSources(query: string, signal: AbortSignal): Promise<SearchResponse> {
  const payload = await request('/api/v1/search', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({query, top_k:5}),
  }, signal);
  if (!record(payload) || !validMeta(payload) || typeof payload.query !== 'string'
    || !['ok','no_results'].includes(String(payload.status))
    || !Array.isArray(payload.results) || !payload.results.every(isSource)) {
    throw new Error('Kết quả API chưa đúng định dạng đã thống nhất.');
  }
  return payload as unknown as SearchResponse;
}

export async function getSource(unitId: string, signal: AbortSignal): Promise<SourceResponse> {
  const payload = await request(`/api/v1/sources/${encodeURIComponent(unitId)}`, {method:'GET'}, signal);
  if (!record(payload) || !validMeta(payload) || !isSource(payload.source) || payload.source.unit_id !== unitId) {
    throw new Error('API chưa trả đúng nguồn được chọn.');
  }
  return payload as unknown as SourceResponse;
}
