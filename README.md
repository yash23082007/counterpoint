# Dialectica ⚖️
**The Debate-to-Decision Engine**

Dialectica is an advanced multi-agent AI application designed to help you make difficult, real-world decisions. When you're stuck on a tough choice (e.g., "Should I take a 20% pay cut for a remote job?"), Dialectica puts your decision on trial. 

Instead of relying on a single AI prompt that might hallucinate or give a generic answer, Dialectica utilizes a structured adversarial debate. Two independent AI agents argue opposite sides of the decision, gathering real-world evidence. A third agent acts as an impartial judge to weigh the arguments against your personal criteria and provide a structured decision matrix.

## 🌟 Why Dialectica Stands Out
- **Adversarial Structure**: By forcing two agents to argue opposite sides, you get a comprehensive view of the pros and cons, free from the "yes-man" bias of standard LLMs.
- **Evidence-Led, Not Vibes**: Advocates are grounded using Tavily Search. They must cite real evidence and data to back up their claims, ensuring your decision is based on facts.
- **Personalized Criteria**: The Judge doesn't just give a verdict; it weighs the arguments specifically against the criteria *you* care about (e.g., financial upside, lifestyle fit, risk tolerance).
- **Clear AI Orchestration**: Built on AutoGen/AG2, demonstrating true multi-agent collaboration and reasoning.

## 🏗️ Architecture Stack
- **Agent Orchestration**: [AutoGen / AG2](https://microsoft.github.io/autogen/)
- **Search & Grounding**: [Tavily Search API](https://tavily.com/)
- **LLM Engine**: Google Gemini (via `google-genai` and `pyautogen`)
- **Backend API**: Python + [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend UI**: [Vite](https://vitejs.dev/) + Vanilla TypeScript

## 🚀 How It Works
1. **Input Your Decision**: Enter the decision you are struggling with and list your criteria for success.
2. **Advocate-For (Pro)**: This agent searches the web for evidence and constructs the strongest possible argument *in favor* of the decision.
3. **Advocate-Against (Con)**: This agent simultaneously researches and constructs the strongest possible argument *against* the decision.
4. **The Judge**: A third impartial agent reviews the transcripts from both advocates. It evaluates the evidence against your stated criteria and outputs a structured Decision Matrix, concluding with a final recommendation.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- [Tavily API Key](https://tavily.com/)
- [Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/yash23082007/Dialectica.git
cd Dialectica
```

### 2. Setup the Python Backend
Navigate to the backend directory and install the required Python packages. It is recommended to use a virtual environment.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

Run the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend will now be running on `http://localhost:8000`.

### 3. Setup the Vite Frontend
Open a new terminal window, navigate to the root directory, and install the Node dependencies:

```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will be accessible at `http://localhost:5173`.

## 💻 Usage
1. Open the frontend application in your browser.
2. Enter your Tavily and Gemini API keys (these are sent securely to your local backend).
3. Type in the decision you want to evaluate and list your criteria.
4. Click **Start Debate**.
5. Watch as the agents research, argue, and finally present the judge's decision matrix!

## 🤝 Contributing
Contributions are welcome! If you have ideas for new features, better agent prompts, or UI improvements, please open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License.
