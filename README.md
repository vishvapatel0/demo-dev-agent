# ShopLite — demo e-commerce app

A small but real e-commerce application used to demo the Jira → dev-agent → GitHub PR pipeline.

- **Backend:** FastAPI (Python) — products, cart, and orders APIs with an in-memory store
- **Frontend:** React + Vite — product catalog, search, cart, and checkout

## Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on http://localhost:5173 (API calls are proxied to the backend on :8000).

## Run the tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

## API overview

| Method | Path | Description |
|---|---|---|
| GET | /api/products | List all products |
| GET | /api/products/{id} | Get one product |
| GET | /api/products/search?q= | Search products by name/description |
| GET | /api/cart | View cart with total |
| POST | /api/cart/items | Add item `{"product_id": 1, "quantity": 2}` |
| DELETE | /api/cart/items/{product_id} | Remove item from cart |
| POST | /api/orders | Checkout: create order from cart |
| GET | /api/orders | List past orders |
