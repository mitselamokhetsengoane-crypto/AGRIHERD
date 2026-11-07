// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriHerdRecords {
    struct Record {
        bytes32 recordHash;
        string recordType;
        string recordRef;
        address submitter;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Record) private records;
    bytes32[] public allRecordHashes;
    
    address public owner;
    mapping(address => bool) public authorizedSubmitters;

    event RecordAdded(
        bytes32 indexed recordHash,
        string recordType,
        string recordRef,
        address indexed submitter,
        uint256 timestamp
    );

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedSubmitters[msg.sender],
            "Not authorized to submit records"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedSubmitters[msg.sender] = true;
    }

    function authorizeSubmitter(address _account) external {
        require(msg.sender == owner, "Only owner can authorize");
        authorizedSubmitters[_account] = true;
    }

    function revokeSubmitter(address _account) external {
        require(msg.sender == owner, "Only owner can revoke");
        authorizedSubmitters[_account] = false;
    }

    function addRecord(
        bytes32 _hash,
        string calldata _recordType,
        string calldata _recordRef
    ) external onlyAuthorized {
        require(!records[_hash].exists, "Record already exists");

        records[_hash] = Record({
            recordHash: _hash,
            recordType: _recordType,
            recordRef: _recordRef,
            submitter: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        allRecordHashes.push(_hash);

        emit RecordAdded(_hash, _recordType, _recordRef, msg.sender, block.timestamp);
    }

    function verifyRecord(bytes32 _hash) external view returns (bool) {
        return records[_hash].exists;
    }

    function getRecord(bytes32 _hash)
        external
        view
        returns (
            string memory recordType,
            string memory recordRef,
            address submitter,
            uint256 timestamp
        )
    {
        require(records[_hash].exists, "Record not found");
        Record memory r = records[_hash];
        return (r.recordType, r.recordRef, r.submitter, r.timestamp);
    }

    function getRecordCount() external view returns (uint256) {
        return allRecordHashes.length;
    }
}