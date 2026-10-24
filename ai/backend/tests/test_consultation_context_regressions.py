from datetime import datetime, timedelta, timezone

from packages.astrology.chart_context import ChartContext


def test_prompt_uses_current_and_upcoming_dashas_instead_of_birth_periods():
    now = datetime.now(timezone.utc)
    def date(days):
        return (now + timedelta(days=days)).isoformat()
    ctx = ChartContext(is_verified=True, dashas=[
        {"planet": "OldBirthPeriod", "start_date": date(-10000), "end_date": date(-9000)},
        {"planet": "UpcomingPeriod", "start_date": date(365), "end_date": date(730)},
        {"planet": "CurrentPeriod", "start_date": date(-365), "end_date": date(365)},
    ])
    prompt = ctx.format_for_prompt()
    assert "OldBirthPeriod Dasha" not in prompt
    assert "CurrentPeriod Dasha" in prompt
    assert prompt.index("CurrentPeriod Dasha") < prompt.index("UpcomingPeriod Dasha")


def test_prompt_does_not_infer_timing_from_invalid_dasha_dates():
    ctx = ChartContext(is_verified=True, dashas=[
        {"planet": "Venus", "start_date": "unknown", "end_date": "unknown"},
    ])
    prompt = ctx.format_for_prompt()
    assert "Venus Dasha" not in prompt
    assert "do not infer timing" in prompt
