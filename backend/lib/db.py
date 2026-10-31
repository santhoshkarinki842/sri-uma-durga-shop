from __future__ import annotations

import copy
from types import SimpleNamespace


class _Cursor:
    def __init__(self, docs):
        self._docs = list(docs)

    def sort(self, *args):
        if not args:
            return self

        if len(args) == 1 and isinstance(args[0], (list, tuple)):
            criteria = list(args[0])
        else:
            criteria = [(args[0], args[1] if len(args) > 1 else 1)]

        for key, direction in reversed(criteria):
            if not isinstance(key, str):
                continue

            def _sort_key(doc, key=key):
                value = doc.get(key)
                if value is None:
                    return ""
                if isinstance(value, str):
                    return value.lower()
                return value

            self._docs = sorted(self._docs, key=_sort_key, reverse=(direction == -1))
        return self

    async def to_list(self, limit=None):
        docs = self._docs
        if limit is not None:
            docs = docs[:limit]
        return copy.deepcopy(docs)


class _Collection:
    def __init__(self, name):
        self.name = name
        self._docs = []

    @staticmethod
    def _apply_projection(doc, projection):
        if not projection:
            return copy.deepcopy(doc)

        result = copy.deepcopy(doc)
        includes_any = any(v in (1, True) for v in projection.values())
        excluded = {k for k, v in projection.items() if v in (0, False)}
        if includes_any:
            allowed = {k for k, v in projection.items() if v not in (0, False)}
            if "_id" not in allowed and "_id" in result:
                result.pop("_id", None)
            for key in list(result.keys()):
                if key not in allowed and key != "_id":
                    del result[key]
            return result

        for key in list(result.keys()):
            if key in excluded or (key == "_id" and projection.get("_id") in (0, False)):
                del result[key]
        return result

    def _matches(self, doc, query):
        if not query:
            return True
        for key, value in query.items():
            if key not in doc and value is not None:
                return False
            if isinstance(value, dict):
                if "$in" in value:
                    if doc.get(key) not in value["$in"]:
                        return False
                    continue
                if not self._matches(doc.get(key, {}), value):
                    return False
                continue
            if doc.get(key) != value:
                return False
        return True

    async def find_one(self, query=None, projection=None):
        query = query or {}
        for doc in self._docs:
            if self._matches(doc, query):
                return self._apply_projection(doc, projection)
        return None

    def find(self, query=None, projection=None):
        query = query or {}
        docs = [copy.deepcopy(doc) for doc in self._docs if self._matches(doc, query)]
        if projection:
            docs = [self._apply_projection(doc, projection) for doc in docs]
        return _Cursor(docs)

    async def insert_one(self, doc):
        self._docs.append(copy.deepcopy(doc))
        return SimpleNamespace(inserted_id=doc.get("id") or len(self._docs))

    async def insert_many(self, docs):
        for doc in docs:
            self._docs.append(copy.deepcopy(doc))
        return SimpleNamespace(inserted_ids=[doc.get("id") or i for i, doc in enumerate(docs, start=1)])

    async def update_one(self, query, update, upsert=False):
        matched = False
        for idx, doc in enumerate(self._docs):
            if self._matches(doc, query):
                matched = True
                if "$set" in update:
                    doc.update(update["$set"])
                if "$push" in update:
                    for key, value in update["$push"].items():
                        current = doc.setdefault(key, [])
                        if isinstance(value, list):
                            current.extend(value)
                        else:
                            current.append(value)
                break
        if not matched and upsert:
            self._docs.append(copy.deepcopy(query))
        return SimpleNamespace(matched_count=1 if matched else 0, modified_count=1 if matched else 0, upserted_id=None)

    async def delete_one(self, query):
        for idx, doc in enumerate(self._docs):
            if self._matches(doc, query):
                del self._docs[idx]
                return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)

    async def count_documents(self, query=None):
        query = query or {}
        return sum(1 for doc in self._docs if self._matches(doc, query))


class _Database:
    def __init__(self):
        self.items = _Collection("items")
        self.admins = _Collection("admins")
        self.settings = _Collection("settings")
        self.orders = _Collection("orders")
        self.status_checks = _Collection("status_checks")

    async def ensure_indexes(self):
        return None


async def ensure_indexes():
    return None


client = SimpleNamespace()
db = _Database()
