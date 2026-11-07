import os
import json
from web3 import Web3
from eth_account import Account
from app.core.config import settings

class BlockchainService:
    def __init__(self):
        # Connect to local Hardhat node or testnet
        RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        
        # Contract configuration from .env
        self.contract_address = os.getenv(
            "CONTRACT_ADDRESS", 
            "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        )
        self.private_key = os.getenv(
            "BLOCKCHAIN_PRIVATE_KEY", 
            # Default Hardhat Account #0 (DO NOT use in production)
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        )
        
        # Load the ABI from the compiled artifact
        self.abi = self._load_abi()
        
        # Initialize contract if connected
        if self.w3.is_connected() and self.abi:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=self.abi
            )
            self.account = self.w3.eth.account.from_key(self.private_key)
        else:
            self.contract = None
            self.account = None

    def _load_abi(self):
        """Load contract ABI from Hardhat compiled artifacts."""
        possible_paths = [
            os.path.join(
                os.path.dirname(__file__), 
                "../../../blockchain/artifacts/contracts/AgriHerdRecords.sol/AgriHerdRecords.json"
            ),
            os.path.join(
                os.path.dirname(__file__), 
                "../../blockchain/artifacts/contracts/AgriHerdRecords.sol/AgriHerdRecords.json"
            ),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                try:
                    with open(path, "r") as f:
                        artifact = json.load(f)
                        return artifact.get("abi", [])
                except Exception as e:
                    print(f"⚠️ Could not load ABI from {path}: {e}")
        
        print("⚠️ Contract ABI not found. Run 'npm run compile' in the blockchain/ folder.")
        return None

    def get_network_status(self):
        """Check blockchain connectivity and return network details."""
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
        """
        Generate a keccak256 hash of the record data.
        The hash must match the format used in the smart contract.
        """
        # Convert dict to a consistent string representation
        record_string = json.dumps(record_data, sort_keys=True)
        return self.w3.keccak(text=record_string).hex()

    def log_record(self, record_hash: str, record_type: str, record_ref: str) -> dict:
        """
        Submit a record hash to the blockchain.
        
        Args:
            record_hash: Keccak256 hash (hex string starting with 0x)
            record_type: e.g., "SALE", "HARVEST", "SCAN", "TRANSFER"
            record_ref: Off-chain DB reference ID
        
        Returns:
            Dict with status, transaction hash, and block number
        """
        if not self.contract:
            return {
                "status": "error",
                "message": "Blockchain not connected or contract not loaded"
            }

        try:
            # Ensure hash is bytes32 format
            if not record_hash.startswith("0x"):
                record_hash = "0x" + record_hash
            
            # Convert hex string to bytes32
            hash_bytes = bytes.fromhex(record_hash.replace("0x", ""))
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            txn = self.contract.functions.addRecord(
                hash_bytes,
                record_type,
                record_ref
            ).build_transaction({
                "from": self.account.address,
                "nonce": nonce,
                "gas": 200000,
                "gasPrice": self.w3.eth.gas_price
            })

            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            return {
                "status": "success",
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "record_type": record_type,
                "record_ref": record_ref
            }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def verify_record(self, record_hash: str) -> dict:
        """
        Verify whether a record hash exists on the blockchain.
        """
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
        """Get total number of records stored on-chain."""
        if not self.contract:
            return 0
        try:
            return self.contract.functions.getRecordCount().call()
        except Exception:
            return 0


# Singleton instance
blockchain_service = BlockchainService()