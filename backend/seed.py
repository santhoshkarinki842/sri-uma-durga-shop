import asyncio

from lib.bootstrap import bootstrap
from lib.db import ensure_indexes


async def main() -> None:
    await ensure_indexes()
    await bootstrap()
    print("Seed complete")


if __name__ == "__main__":
    asyncio.run(main())
