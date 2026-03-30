import os
import logging
from typing import List, Tuple
from openai import OpenAI
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

def _get_openai():
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

_pc = None
_index = None


def _get_index():
    global _pc, _index
    if _index is None:
        _pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        _index = _pc.Index(os.getenv("PINECONE_INDEX", "enterprise-rag"))
    return _index


def get_namespace(company_id: int = None, user_id: int = None, session_id: str = None) -> str:
    if session_id:
        return f"guest-{session_id}"
    return f"company-{company_id}-user-{user_id}"


EMBEDDING_DIMENSIONS = 1024

def embed_text(text: str) -> List[float]:
    response = _get_openai().embeddings.create(
        input=text,
        model="text-embedding-3-small",
        dimensions=EMBEDDING_DIMENSIONS,
    )
    return response.data[0].embedding


def ingest_document(text: str, doc_id: int, filename: str, namespace: str) -> int:
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_text(text)

    index = _get_index()
    vectors = []
    for i, chunk in enumerate(chunks):
        embedding = embed_text(chunk)
        vectors.append({
            "id": f"doc-{doc_id}-chunk-{i}",
            "values": embedding,
            "metadata": {"text": chunk, "filename": filename, "doc_id": doc_id}
        })

    # Upsert in batches of 100
    for i in range(0, len(vectors), 100):
        index.upsert(vectors=vectors[i:i+100], namespace=namespace)

    return len(chunks)


def retrieve_context(query: str, namespace: str, top_k: int = 5) -> List[str]:
    index = _get_index()
    query_embedding = embed_text(query)
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        namespace=namespace,
        include_metadata=True
    )
    return [match["metadata"]["text"] for match in results["matches"]]


def delete_namespace(namespace: str):
    try:
        index = _get_index()
        index.delete(delete_all=True, namespace=namespace)
    except Exception as e:
        logger.error("Failed to delete Pinecone namespace %s: %s", namespace, e)
