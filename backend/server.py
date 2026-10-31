import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from lib.bootstrap import bootstrap
from lib.db import ensure_indexes
from routers import auth as auth_router, items as items_router, orders as orders_router, settings as settings_router

api_router = APIRouter()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    try:
        await bootstrap()
    except Exception as exc:
        logging.getLogger(__name__).error("bootstrap failed: %s", exc)
    yield


app = FastAPI(title="Sri Uma Durga Sweets & Hot", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:4173", "http://127.0.0.1:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for _r in (auth_router, items_router, settings_router, orders_router):
    api_router.include_router(_r.router)

app.include_router(api_router)