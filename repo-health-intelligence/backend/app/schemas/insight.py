from datetime import datetime

from pydantic import BaseModel


class AIInsightPlaceholder(BaseModel):
    id: str
    title: str
    description: str
    category: str
    severity: str
    timestamp: datetime
    recommendation: str
    impact: str
    placeholder: bool = True


class InsightsFeedResponse(BaseModel):
    has_data: bool
    no_data_message: str
    insights: list[AIInsightPlaceholder]
    predictions: list[dict]
    recommendations: list[dict]

