# demo-dev-agent

A tiny Flask API used to demo the Jira → dev-agent → GitHub PR pipeline.

## Run

```bash
pip install -r requirements.txt
python app.py
```

## Test

```bash
pip install -r requirements-dev.txt
pytest
```

## Endpoints

- `GET /health` — returns `{"status": "ok"}`
- `GET /greet?name=World` — returns a greeting
- `GET /calc/divide?a=10&b=2` — divides two numbers
