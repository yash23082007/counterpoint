from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import autogen
from tavily import TavilyClient
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DebateRequest(BaseModel):
    topic: str
    criteria: list[str]
    gemini_api_key: str
    tavily_api_key: str

@app.post("/api/debate")
async def debate(req: DebateRequest):
    if not req.gemini_api_key or not req.tavily_api_key:
        raise HTTPException(status_code=400, detail="API keys are required.")

    # Initialize Tavily
    tavily_client = TavilyClient(api_key=req.tavily_api_key)

    def search_web(query: str) -> str:
        """Search the web for evidence."""
        try:
            response = tavily_client.search(query, max_results=3)
            return str(response.get("results", []))
        except Exception as e:
            return f"Search failed: {e}"

    llm_config = {
        "config_list": [
            {
                "model": "gemini-1.5-pro-latest",
                "api_key": req.gemini_api_key,
                "api_type": "google"
            }
        ],
        "temperature": 0.2,
    }

    # Create Agents
    advocate_for = autogen.AssistantAgent(
        name="Advocate_For",
        system_message="You are the Advocate For. Your goal is to argue IN FAVOR of the decision topic. Use the search_web tool to find factual evidence. Do not rely on vibes. Cite your sources.",
        llm_config=llm_config,
    )

    advocate_against = autogen.AssistantAgent(
        name="Advocate_Against",
        system_message="You are the Advocate Against. Your goal is to argue AGAINST the decision topic. Use the search_web tool to find factual evidence. Do not rely on vibes. Cite your sources.",
        llm_config=llm_config,
    )

    judge = autogen.AssistantAgent(
        name="Judge",
        system_message=f"You are the Judge. You must weigh the arguments presented by Advocate_For and Advocate_Against based on the user's criteria: {', '.join(req.criteria)}. Output a structured decision matrix comparing both sides against each criterion, and a final recommendation. Do not ask for further input, make the final decision.",
        llm_config=llm_config,
    )
    
    user_proxy = autogen.UserProxyAgent(
        name="UserProxy",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=0,
        is_termination_msg=lambda x: True,
    )

    # Register tools
    autogen.agentchat.register_function(
        search_web,
        caller=advocate_for,
        executor=user_proxy,
        name="search_web",
        description="Search the web for evidence"
    )
    autogen.agentchat.register_function(
        search_web,
        caller=advocate_against,
        executor=user_proxy,
        name="search_web",
        description="Search the web for evidence"
    )

    groupchat = autogen.GroupChat(
        agents=[user_proxy, advocate_for, advocate_against, judge],
        messages=[],
        max_round=6,
        speaker_selection_method="round_robin",
        allow_repeat_speaker=False,
    )
    
    manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=llm_config)

    prompt = f"Decision Topic: {req.topic}\nCriteria: {', '.join(req.criteria)}\nAdvocate_For, please present your case first."

    # Start debate
    try:
        user_proxy.initiate_chat(
            manager,
            message=prompt,
        )
    except Exception as e:
        print("Chat execution error:", e)

    # Extract history
    history = []
    for msg in groupchat.messages:
        history.append({
            "speaker": msg.get("name"),
            "content": msg.get("content")
        })

    return {"history": history}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
