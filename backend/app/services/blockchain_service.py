import os
import httpx
import logging
from urllib.parse import quote

from fastapi import HTTPException

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        self.service_url = os.getenv("BLOCKCHAIN_SERVICE_URL", "http://localhost:3001")
        self.token = os.getenv("BLOCKCHAIN_SERVICE_TOKEN", "dev-secret-token")
        self.headers = {
            "Authorization": f"Bearer {self.token}", 
            "Content-Type": "application/json"
        }

    async def log_record(self, record_type: str, record_ref: str, data: dict) -> dict:
        """Sends the record to the custom Node.js engine."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.service_url}/transactions",
                    headers=self.headers,
                    json={
                        "recordType": record_type,
                        "recordRef": record_ref,
                        "data": data
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Blockchain rejected request: {e.response.text}")
            return {"status": "error", "message": e.response.text}
        except Exception as e:
            logger.error(f"Blockchain node unreachable: {e}")
            return {"status": "error", "message": str(e)}

    async def verify_chain(self) -> dict:
        """Asks the Node.js engine to verify the entire chain."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.service_url}/verify-chain",
                    headers=self.headers,
                    timeout=20.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Chain verify error: {e}")
            return {"status": "ERROR", "verified": False}

    async def verify_record(self, transaction_hash: str) -> dict:
        """Verify a stored transaction against the live blockchain service."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.service_url}/verify-record/{quote(transaction_hash, safe='')}",
                    headers=self.headers,
                    timeout=20.0,
                )
                if response.status_code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail="The transaction was not found on the blockchain network.",
                    )
                response.raise_for_status()
                result = response.json()
                if not isinstance(result, dict) or not isinstance(result.get("verified"), bool):
                    raise HTTPException(
                        status_code=502,
                        detail="The blockchain service returned an invalid verification response.",
                    )
                return result
        except HTTPException:
            raise
        except httpx.HTTPError as exc:
            logger.exception("Could not verify blockchain transaction.")
            raise HTTPException(
                status_code=503,
                detail="The blockchain service is unreachable or returned an error.",
            ) from exc
        except ValueError as exc:
            logger.exception("Could not parse blockchain verification response.")
            raise HTTPException(
                status_code=502,
                detail="The blockchain service returned invalid JSON.",
            ) from exc

blockchain_service = BlockchainService()