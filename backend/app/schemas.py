from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

EMAIL_MAX = 255
NAME_MAX = 120
TITLE_MAX = 200
TEXT_MIN = 1


class AuthBase(BaseModel):
    email: EmailStr = Field(max_length=EMAIL_MAX)
    password: str = Field(min_length=8, max_length=128)


class RegisterIn(AuthBase):
    name: str = Field(min_length=1, max_length=NAME_MAX)


class LoginIn(AuthBase):
    pass


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    plan: str
    created_at: datetime


class ScopeEntryIn(BaseModel):
    text: str = Field(min_length=TEXT_MIN, max_length=4000)


class ScopeEntryOut(ScopeEntryIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    created_at: datetime


class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=TITLE_MAX)
    hourly_rate: float = Field(ge=0, le=1000000)
    notes: str = Field(default="", max_length=10000)
    scope_entries: list[ScopeEntryIn] = Field(default_factory=list, max_length=200)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=TITLE_MAX)
    status: str | None = Field(default=None, pattern="^(active|completed|archived)$")
    hourly_rate: float | None = Field(default=None, ge=0, le=1000000)
    notes: str | None = Field(default=None, max_length=10000)


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    status: str
    hourly_rate: float
    notes: str
    created_at: datetime
    updated_at: datetime
    scope_entries: list[ScopeEntryOut] = []
    requests: list["RequestOut"] = []
    change_orders: list["ChangeOrderOut"] = []


class RequestIn(BaseModel):
    text: str = Field(min_length=TEXT_MIN, max_length=4000)


class RequestUpdate(BaseModel):
    classification: str | None = Field(default=None, pattern="^(IN_SCOPE|OUT_OF_SCOPE|DISCUSS)$")
    status: str | None = Field(default=None, pattern="^(OPEN|RESOLVED)$")


class RequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    text: str
    classification: str
    status: str
    created_at: datetime
    change_order_id: int | None = None


class ChangeOrderIn(BaseModel):
    title: str = Field(min_length=1, max_length=TITLE_MAX)
    description: str = Field(default="", max_length=10000)
    hours: float = Field(ge=0.25, le=100000)
    rate: float = Field(ge=0, le=1000000)
    request_ids: list[int] = Field(default_factory=list, max_length=500)


class ChangeOrderUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=TITLE_MAX)
    description: str | None = Field(default=None, max_length=10000)
    hours: float | None = Field(default=None, ge=0.25, le=100000)
    rate: float | None = Field(default=None, ge=0, le=1000000)
    status: str | None = Field(default=None, pattern="^(DRAFT|SENT|APPROVED|REJECTED|PAID)$")


class ChangeOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str
    hours: float
    rate: float
    amount: float
    status: str
    share_token: str
    created_at: datetime
    decided_at: datetime | None = None
    requests: list[RequestOut] = []


class ProjectStats(BaseModel):
    project_id: int
    in_scope_count: int
    out_of_scope_count: int
    open_requests_count: int
    change_orders_total: float  # sum of approved + sent amounts
    approved_amount: float
    paid_amount: float
    pending_amount: float  # value of SENT/APPROVED change orders not yet paid


ProjectOut.model_rebuild()
TokenOut.model_rebuild()


class DetailOut(BaseModel):
    detail: str