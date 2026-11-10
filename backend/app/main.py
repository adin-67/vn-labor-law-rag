from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .retrieval import get_retriever, RetrievalUnavailable, InvalidRetrievalData
from .schemas import SearchRequest, SearchResponse, SourceResponse

app = FastAPI(title="LạcLuật — API học tích hợp của C", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def checked_retriever():
    try:
        return get_retriever()
    except RetrievalUnavailable as error:
        raise HTTPException(503, detail={"code": "retrieval_unavailable", "message": str(error)}) from error
    except InvalidRetrievalData as error:
        raise HTTPException(503, detail={"code": "invalid_source_data", "message": str(error)}) from error


@app.get("/health")
def health():
    try:
        retriever = get_retriever()
        return {"api_status": "ok", "retrieval_ready": True, "mode": retriever.mode,
                "snapshot_id": retriever.snapshot_id}
    except (RetrievalUnavailable, InvalidRetrievalData):
        return {"api_status": "ok", "retrieval_ready": False}


@app.post("/api/v1/search", response_model=SearchResponse)
def search(body: SearchRequest):
    retriever = checked_retriever()
    try:
        results = retriever.search(body.query, body.top_k)
    except RetrievalUnavailable as error:
        raise HTTPException(503, detail={"code": "retrieval_unavailable", "message": str(error)}) from error
    except InvalidRetrievalData as error:
        raise HTTPException(502, detail={"code": "invalid_retrieval_result", "message": str(error)}) from error
    return SearchResponse(mode=retriever.mode, snapshot_id=retriever.snapshot_id,
                          status="ok" if results else "no_results", query=body.query, results=results)


@app.get("/api/v1/sources/{unit_id}", response_model=SourceResponse)
def source(unit_id: str):
    retriever = checked_retriever()
    try:
        result = retriever.get_source(unit_id)
    except RetrievalUnavailable as error:
        raise HTTPException(503, detail={"code": "retrieval_unavailable", "message": str(error)}) from error
    except InvalidRetrievalData as error:
        raise HTTPException(502, detail={"code": "invalid_source_result", "message": str(error)}) from error
    if result is None:
        raise HTTPException(404, detail={"code": "source_not_found", "message": "Không tìm thấy mã nguồn này."})
    return SourceResponse(mode=retriever.mode, snapshot_id=retriever.snapshot_id, source=result)
