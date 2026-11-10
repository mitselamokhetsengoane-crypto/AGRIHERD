import os
import json
import logging
from web3 import Web3

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        # Connects to Render's Sepolia URL, or falls back to local Hardhat
        self.rpc_url = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Pulls from Render Environment Variables
        self.contract_address = os.getenv("CONTRACT_ADDRESS", "")
        self.private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "")
        
        self.abi = self._load_abi()
        self.contract = None
        self.account = None
        
        if self.w3.is_connected() and self.abi and self.contract_address and self.private_key:
            try:
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=self.abi
                )
                self.account = self.w3.eth.account.from_key(self.private_key)
                logger.info(f"Blockchain service ready on chain {self.w3.eth.chain_id}")
            except Exception as e:
                logger.error(f"Failed to initialize contract: {e}")
        else:
            logger.warning("Blockchain service is inactive. Missing connection details or ABI.")

    def _load_abi(self):
        # Looks for the compiled JSON artifact in the blockchain folder
        path = os.path.join(
            os.path.dirname(__file__), 
            "../../../blockchain/artifacts/contracts/AgriHerdRecords.sol/AgriHerdRecords.json"
        )
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f).get("abi", [])
            except Exception as e:
                logger.error(f"Error reading ABI: {e}")
        logger.warning("Contract ABI not found. Run 'npx hardhat compile' in the blockchain/ folder.")
        return None

    def get_network_status(self):
        try:
            connected = self.w3.is_connected()
            return {
                "connected": connected,
                "chain_id": self.w3.eth.chain_id if connected else None,
                "contract_address": self.contract_address,
                "contract_loaded": self.contract is not None
            }
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def generate_hash(self, record_data: dict) -> str:
        # Canonical JSON stringification for consistent hashing
        record_string = json.dumps(record_data, sort_keys=True, separators=(',', ':'))
        return self.w3.keccak(text=record_string).hex()

    def log_record(self, record_hash: str, record_type: str, record_ref: str) -> dict:
        if not self.contract or not self.account:
            return {"status": "error", "message": "Blockchain not configured or offline."}
        try:
            if not record_hash.startswith("0x"):
                record_hash = "0x" + record_hash
            hash_bytes = bytes.fromhex(record_hash.replace("0x", ""))

            nonce = self.w3.eth.get_transaction_count(self.account.address)
            txn = self.contract.functions.addRecord(hash_bytes, record_type, record_ref).build_transaction({
                "from": self.account.address,
                "nonce": nonce,
                "gas": 300000,
                "gasPrice": self.w3.eth.gas_price
            })

            signed_txn = self.w3.eth.account.sign_transaction(txn, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            return {
                "status": "success",
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber
            }
        except Exception as e:
            logger.error(f"Transaction failed: {e}")
            return {"status": "error", "message": str(e)}

    def verify_record(self, record_hash: str) -> dict:
        if not self.contract:
            return {"exists": False, "message": "Blockchain not connected"}
        try:
            if not record_hash.startswith("0x"):
                record_hash = "0x" + record_hash
            hash_bytes = bytes.fromhex(record_hash.replace("0x", ""))
            
            exists = self.contract.functions.verifyRecord(hash_bytes).call()
            if exists:
                record_data = self.contract.functions.getRecord(hash_bytes).call()
                return {
                    "exists": True,
                    "record_type": record_data[0],
                    "record_ref": record_data[1],
                    "submitter": record_data[2],
                    "timestamp": record_data[3]
                }
            return {"exists": False, "message": "Record not found on chain"}
        except Exception as e:
            return {"exists": False, "message": str(e)}

    def get_record_count(self) -> int:
        if not self.contract:
            return 0
        try:
            return self.contract.functions.getRecordCount().call()
        except Exception:
            return 0

# Singleton instance
blockchain_service = BlockchainService()