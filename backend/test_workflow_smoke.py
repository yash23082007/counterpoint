import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from starlette.requests import Request


_database_dir = tempfile.TemporaryDirectory(prefix="counterpoint-smoke-")
os.environ["DATABASE_PATH"] = str(Path(_database_dir.name) / "smoke.db")
os.environ["GROQ_API_KEY"] = "smoke-test-key"
os.environ["GEMINI_API_KEY"] = "smoke-test-key"
os.environ["TAVILY_API_KEY"] = "smoke-test-key"
os.environ.pop("TRUSTED_PROXY_CIDRS", None)

import main as api  # noqa: E402


class WorkflowSmokeTest(unittest.TestCase):
    def test_analysis_privacy_comparison_and_proxy_ip(self):
        observed = {"queries": [], "judge_prompt": ""}

        async def fake_search(_client, query):
            observed["queries"].append(query)
            return [{
                "title": "Example evidence",
                "url": "https://example.org/evidence",
                "content": "A relevant search snippet.",
            }]

        async def fake_groq(_client, system, prompt, json_mode=False):
            if json_mode:
                rows = [
                    {"option": "Keep current role", "criterion": "Budget", "score": 4, "reasoning": "Fits the budget [1]", "sources": [1]},
                    {"option": "Keep current role", "criterion": "Time", "score": 3, "reasoning": "Stable schedule", "sources": []},
                    {"option": "Join startup", "criterion": "Budget", "score": 2, "reasoning": "Income uncertainty", "sources": []},
                ]
                return json.dumps({"confidence": "High", "scorecard": rows, "change_triggers": []})
            if system.startswith("You are the decision framer"):
                return "Decision frame\nUnknown: start date\nResearch angles: salary"
            if system.startswith("You are the evidence researcher"):
                return "Evidence is limited [1]."
            if "red-team reviewer" in system:
                return "Verify the offer terms."
            if "IN FAVOR" in system:
                return "Case for: growth."
            if "AGAINST" in system:
                return "Case against: risk."
            return "Role output."

        async def fake_gemini(_client, prompt, **_kwargs):
            observed["judge_prompt"] = prompt
            return "Recommendation\nCompare the options carefully."

        with (
            patch.object(api, "tavily_search", fake_search),
            patch.object(api, "groq_completion", fake_groq),
            patch.object(api, "gemini_completion", fake_gemini),
            TestClient(api.app) as client,
        ):
            signup = client.post("/api/auth/signup", json={
                "email": "smoke@example.org",
                "password": "long-enough-smoke-pass",
            })
            self.assertEqual(signup.status_code, 200, signup.text)

            response = client.post("/api/debate", json={
                "topic": "Should I leave my current job?",
                "criteria": ["Budget", "budget", "Time"],
                "options": ["Keep current role", "Join startup"],
                "context": "PRIVATE_CONTEXT_SHOULD_NOT_REACH_SEARCH",
            })
            self.assertEqual(response.status_code, 200, response.text)
            result = response.json()
            self.assertNotIn("PRIVATE_CONTEXT_SHOULD_NOT_REACH_SEARCH", observed["queries"][0])
            self.assertNotIn("Research angles", observed["queries"][0])
            self.assertEqual(len(result["scorecard"]), 4)
            self.assertEqual(sum(row["score"] is None for row in result["scorecard"]), 1)
            self.assertEqual(result["confidence"], "Low")
            self.assertIn("OPTION-BY-CRITERION COMPARISON", observed["judge_prompt"])
            self.assertEqual(len(result["comparison_options"]), 2)

            blank_topic = client.post("/api/debate", json={
                "topic": " " * 40,
                "criteria": ["Budget"],
            })
            self.assertEqual(blank_topic.status_code, 422)

            health = client.get("/api/health")
            self.assertEqual(health.status_code, 200)
            self.assertTrue(health.json()["database"])
            self.assertEqual(health.json()["options"]["maximum"], 5)
            version = client.get("/api/version")
            self.assertEqual(version.status_code, 200)
            self.assertEqual(version.json()["options"]["maximum"], 5)
            with patch.dict(os.environ, {"GROQ_API_KEY": ""}):
                degraded_health = client.get("/api/health")
                self.assertEqual(degraded_health.status_code, 503)
                self.assertEqual(degraded_health.json()["status"], "degraded")

        direct_request = Request({
            "type": "http",
            "headers": [(b"x-forwarded-for", b"203.0.113.77")],
            "client": ("198.51.100.12", 1234),
            "server": ("test", 80),
            "method": "GET",
            "path": "/",
        })
        self.assertEqual(api.request_ip(direct_request), "198.51.100.12")

        os.environ["TRUSTED_PROXY_CIDRS"] = "10.0.0.0/8"
        trusted_request = Request({
            "type": "http",
            "headers": [(b"x-forwarded-for", b"203.0.113.77, 10.0.0.8")],
            "client": ("10.0.0.9", 1234),
            "server": ("test", 80),
            "method": "GET",
            "path": "/",
        })
        self.assertEqual(api.request_ip(trusted_request), "203.0.113.77")


if __name__ == "__main__":
    unittest.main()
