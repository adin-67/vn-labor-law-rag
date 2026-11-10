from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Query = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=3000)]


class SearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: Query
    top_k: int = Field(default=5, ge=1, le=10, strict=True)


class Source(BaseModel):
    model_config = ConfigDict(extra="forbid")
    unit_id: str = Field(min_length=1)
    document_id: str = Field(min_length=1)
    version_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    article: str | None = None
    clause: str | None = None
    point: str | None = None
    text: str = Field(min_length=1)
    page_from: int | None = Field(default=None, ge=1)
    page_to: int | None = Field(default=None, ge=1)
    source_url: str | None = None

    @model_validator(mode="after")
    def valid_page_range(self):
        if self.page_from is not None and self.page_to is not None and self.page_to < self.page_from:
            raise ValueError("page_to must be greater than or equal to page_from")
        return self


class SearchResponse(BaseModel):
    mode: Literal["mock", "b"]
    snapshot_id: str
    status: Literal["ok", "no_results"]
    query: str
    results: list[Source]


class SourceResponse(BaseModel):
    mode: Literal["mock", "b"]
    snapshot_id: str
    source: Source

class AnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: Query


class AnswerResponse(BaseModel):
    status: Literal["answered", "insufficient_evidence"]
    answer: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
    citations: list[Source]
    snapshot_id: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_citations(self):
        if self.status == "answered" and not self.citations:
            raise ValueError("An answered response requires at least one citation.")

        if self.status == "insufficient_evidence" and self.citations:
            raise ValueError("An insufficient-evidence response must have no citations.")

        return self
