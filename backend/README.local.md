Local setup & run (backend)

1. Create and activate virtual environment (macOS / zsh):

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
```

2. Install pinned dependencies:

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

3. Set your Gemini API key in an env file (or export in shell):

```bash
# backend/.env
GEMINI_API_KEY=YOUR_KEY_HERE
```

4. Run the server:

```bash
# from project root
cd backend
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Notes:
- If Pylance still shows missing import warnings, make sure VS Code is using the workspace python interpreter above.
- The code supports either `google.generativeai` (deprecated) or `google.genai` (new). If you want the new package, update requirements and client usage accordingly.
