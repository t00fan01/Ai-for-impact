import pytest
from main import _parse_llm_json, _normalize_analysis


def test_parse_valid_json():
    raw = '{"match_score": 80, "scam_probability_score": 10, "scam_red_flags": ["flag1"], "missing_skills": ["skill1"], "study_recommendations": ["read book"]}'
    parsed = _parse_llm_json(raw)
    assert isinstance(parsed, dict)
    assert parsed["match_score"] == 80


def test_parse_embedded_json():
    raw = "Some text before {\"match_score\": 70, \"scam_probability_score\": 5} some text after"
    parsed = _parse_llm_json(raw)
    assert parsed["match_score"] == 70


def test_normalize_ok():
    payload = {
        "match_score": 50,
        "scam_probability_score": 20,
        "scam_red_flags": [" f1  ", "f2"],
        "missing_skills": ["s1"],
        "study_recommendations": ["r1"]
    }
    norm = _normalize_analysis(payload)
    assert norm.match_score == 50
    assert norm.scam_red_flags == ["f1", "f2"]