from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .retrieval import InvalidRetrievalData, RetrievalUnavailable, get_retriever
from .schemas import (
    AnswerRequest,
    AnswerResponse,
    SearchRequest,
    SearchResponse,
    SourceResponse,
)


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
        raise HTTPException(
            status_code=503,
            detail={"code": "retrieval_unavailable", "message": str(error)},
        ) from error
    except InvalidRetrievalData as error:
        raise HTTPException(
            status_code=503,
            detail={"code": "invalid_source_data", "message": str(error)},
        ) from error


def checked_search(retriever, query: str, top_k: int):
    try:
        return retriever.search(query, top_k)
    except RetrievalUnavailable as error:
        raise HTTPException(
            status_code=503,
            detail={"code": "retrieval_unavailable", "message": str(error)},
        ) from error
    except InvalidRetrievalData as error:
        raise HTTPException(
            status_code=502,
            detail={"code": "invalid_retrieval_result", "message": str(error)},
        ) from error


@app.get("/health")
def health():
    try:
        retriever = get_retriever()
    except (RetrievalUnavailable, InvalidRetrievalData):
        return {"api_status": "ok", "retrieval_ready": False}

    return {
        "api_status": "ok",
        "retrieval_ready": True,
        "mode": retriever.mode,
        "snapshot_id": retriever.snapshot_id,
    }


@app.post("/api/v1/search", response_model=SearchResponse)
def search(body: SearchRequest):
    retriever = checked_retriever()
    results = checked_search(retriever, body.query, body.top_k)

    return SearchResponse(
        mode=retriever.mode,
        snapshot_id=retriever.snapshot_id,
        status="ok" if results else "no_results",
        query=body.query,
        results=results,
    )


@app.post("/api/v1/answer", response_model=AnswerResponse)
def answer(body: AnswerRequest):
    retriever = checked_retriever()

    if retriever.mode != "b":
        raise HTTPException(
            status_code=503,
            detail={
                "code": "answer_requires_bm25",
                "message": "Hãy chạy API ở chế độ BM25.",
            },
        )

    candidates = checked_search(retriever, body.query, top_k=3)

    if candidates:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "answer_not_configured",
                "message": "Bộ tạo câu trả lời chưa được cấu hình.",
            },
        )

    return AnswerResponse(
        status="insufficient_evidence",
        answer="Dữ liệu hiện có chưa đủ căn cứ để trả lời câu hỏi này.",
        citations=[],
        snapshot_id=retriever.snapshot_id,
    )


@app.get("/api/v1/sources/{unit_id}", response_model=SourceResponse)
def source(unit_id: str):
    retriever = checked_retriever()

    try:
        result = retriever.get_source(unit_id)
    except RetrievalUnavailable as error:
        raise HTTPException(
            status_code=503,
            detail={"code": "retrieval_unavailable", "message": str(error)},
        ) from error
    except InvalidRetrievalData as error:
        raise HTTPException(
            status_code=502,
            detail={"code": "invalid_source_result", "message": str(error)},
        ) from error

    if result is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "source_not_found",
                "message": "Không tìm thấy mã nguồn này.",
            },
        )

    return SourceResponse(
        mode=retriever.mode,
        snapshot_id=retriever.snapshot_id,
        source=result,
    )