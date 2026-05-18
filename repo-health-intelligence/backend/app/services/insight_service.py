from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.insight import AIInsightPlaceholder, InsightsFeedResponse


class InsightService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def feed(self, has_data: bool) -> InsightsFeedResponse:
        if not has_data:
            return InsightsFeedResponse(
                has_data=False,
                no_data_message="No repository analyzed yet",
                insights=[],
                predictions=[],
                recommendations=[],
            )

        placeholder = AIInsightPlaceholder(
            id="ai-placeholder-1",
            title="AI insights pipeline placeholder",
            description="AI/LLM insights are intentionally disabled for this release.",
            category="recommendation",
            severity="info",
            timestamp=datetime.utcnow(),
            recommendation="Use commit, hotspot, architecture, and contributor analytics while AI is pending.",
            impact="No AI-generated summaries or predictions are executed.",
            placeholder=True,
        )
        return InsightsFeedResponse(
            has_data=True,
            no_data_message="",
            insights=[placeholder],
            predictions=[],
            recommendations=[
                {
                    "title": "Future AI endpoint ready",
                    "effort": "N/A",
                    "impact": "Fast integration path",
                    "priority": "High",
                }
            ],
        )

