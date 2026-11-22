// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting
 * @dev Decentralized Voting Smart Contract deployed on Ethereum Sepolia Testnet.
 * Contract Address: 0x1aE68E26A44b691200A2743b6bF7706CC1c2039c
 */
contract Voting {

    // Structure to store candidate information
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // List of candidates
    Candidate[] private candidates;

    // Tracks whether an address has already voted
    mapping(address => bool) private voters;

    // Event emitted after a successful vote
    event VoteCast(
        address indexed voter,
        uint256 indexed candidateId,
        string candidateName
    );

    // Constructor initializes three candidates
    constructor() {
        candidates.push(Candidate(1, "Alice", 0));
        candidates.push(Candidate(2, "Bob", 0));
        candidates.push(Candidate(3, "Charlie", 0));
    }

    // Allows an address to vote for a candidate
    function vote(uint256 candidateId) public {
        require(!voters[msg.sender], "You have already voted");
        require(
            candidateId > 0 && candidateId <= candidates.length,
            "Invalid candidate ID"
        );

        voters[msg.sender] = true;
        candidates[candidateId - 1].voteCount++;

        emit VoteCast(
            msg.sender,
            candidateId,
            candidates[candidateId - 1].name
        );
    }

    // Retrieves details of a particular candidate
    function getCandidate(uint256 candidateId)
        public
        view
        returns (uint256, string memory, uint256)
    {
        require(
            candidateId > 0 && candidateId <= candidates.length,
            "Invalid candidate ID"
        );

        Candidate memory c = candidates[candidateId - 1];
        return (c.id, c.name, c.voteCount);
    }

    // Returns the total number of candidates
    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    // Checks whether an address has already voted
    function hasVoted(address voter) public view returns (bool) {
        return voters[voter];
    }

    // Retrieves the complete list of candidates
    function getAllCandidates()
        public
        view
        returns (Candidate[] memory)
    {
        return candidates;
    }
}
