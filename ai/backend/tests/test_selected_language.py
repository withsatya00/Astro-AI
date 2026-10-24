"""The current question language wins over the website menu."""
import re

import pytest

from ai.backend.app.services.llm_service import (
    _response_language,
    generate_demo_response,
    is_in_astrology_domain,
)
from packages.astrology.chart_context import validate_and_build_chart_context


@pytest.mark.parametrize("question,selected,expected", [
    ("मेरी शादी कब होगी?", "en", "hi"),
    ("मेरी कुण्डली में क्या है?", "en", "hi"),
    ("meri shaadi kab hogi", "en", "hinglish"),
    ("When will my career improve?", "hi", "en"),
    ("What is my Moon sign?", "hi", "en"),
    ("আমার বিয়ে কবে হবে?", "en", "bn"),
    ("", "hi", "hi"),
])
def test_question_language_has_priority(question, selected, expected):
    assert _response_language(question, selected) == expected


@pytest.mark.parametrize("question", [
    "When will I marry?", "How will my career develop?", "moon sign",
    "money", "health", "show my kundli", "continue", "hello",
])
def test_english_offline_response_has_no_hindi_or_hinglish(question):
    response = generate_demo_response(
        question, chart_context=validate_and_build_chart_context(None),
        language="en", conversation_history=[], citations=[],
    )
    assert not re.search(r"[\u0900-\u097f]", response)
    assert not re.search(r"\b(aapki|kripya|batayein|karein|hai|hain)\b", response, re.I)


def test_hindi_question_overrides_english_menu():
    response = generate_demo_response(
        "मेरी शादी कब होगी?",
        chart_context=validate_and_build_chart_context(None),
        language="en", conversation_history=[], citations=[],
    )
    assert re.search(r"[\u0900-\u097f]", response)


@pytest.mark.parametrize("question,language,has_hindi", [("write python code", "hi", False), ("पायथन कोड लिखो", "en", True)])
def test_scope_message_obeys_question_language(question, language, has_hindi):
    allowed, refusal = is_in_astrology_domain(question, language=language)
    assert not allowed
    assert bool(re.search(r"[\u0900-\u097f]", refusal)) == has_hindi
