from dataclasses import dataclass


@dataclass
class FutureAIRequest:
    repository_id: int
    context: dict


class FutureAIService:
    """Reserved service contract for future AI integrations."""

    async def generate_insights(self, request: FutureAIRequest) -> dict:
        return {
            "enabled": False,
            "message": "AI integration is not enabled in this release.",
            "repository_id": request.repository_id,
            "insights": [],
        }

