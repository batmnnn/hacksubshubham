// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleMafia
 * @notice A complete 5-player on-chain Mafia game for Monad Testnet
 * @dev Features: Fixed 5 players, 2 Mafia (slots 0,1), 3 Town (slots 2,3,4)
 *      Entry fee: 0.1 ETH, Commit-reveal voting, Night kills, Winner payouts
 * @author Built for Scaffold-ETH 2 on Monad
 */
contract SimpleMafia {
    // Game constants
    uint256 public constant ENTRY_FEE = 0.1 ether;
    uint256 public constant MAX_PLAYERS = 5;
    uint256 public constant MAFIA_COUNT = 2;
    uint256 public constant TOWN_COUNT = 3;

    // Game phases
    enum Phase { LOBBY, DAY_COMMIT, DAY_REVEAL, NIGHT, ENDED }
    
    // Player roles
    enum Role { TOWN, MAFIA }
    
    // Player struct
    struct Player {
        address addr;
        Role role;
        bool isAlive;
        bool hasCommittedVote;
        bool hasRevealedVote;
        bool hasVotedNight;
        bytes32 voteCommitment;
        address dayVoteTarget;
        address nightVoteTarget;
    }

    // Game state
    Phase public currentPhase;
    Player[MAX_PLAYERS] public players;
    uint256 public playerCount;
    uint256 public aliveCount;
    uint256 public aliveMafiaCount;
    uint256 public aliveTownCount;
    uint256 public dayCommitCount;
    uint256 public dayRevealCount;
    uint256 public nightVoteCount;
    
    mapping(address => uint256) public playerIndex;
    mapping(address => bool) public isPlayer;
    mapping(address => uint256) public dayVotes;
    mapping(address => uint256) public nightVotes;
    
    address public winner; // Address of winner for single winner games
    Role public winnerSide; // Winning side for team games
    bool public gameStarted;

    // Events
    event PlayerJoined(address indexed player, uint256 playerIndex);
    event GameStarted();
    event PhaseChanged(Phase newPhase);
    event VoteCommitted(address indexed voter);
    event VoteRevealed(address indexed voter, address indexed target);
    event NightVoteCast(address indexed voter, address indexed target);
    event PlayerEliminated(address indexed player, Role role);
    event GameEnded(Role winnerSide, address[] winners);

    // Modifiers
    modifier onlyPlayer() {
        require(isPlayer[msg.sender], "Not a player");
        _;
    }

    modifier onlyAlive() {
        require(players[playerIndex[msg.sender]].isAlive, "Player is dead");
        _;
    }

    modifier onlyPhase(Phase phase) {
        require(currentPhase == phase, "Wrong phase");
        _;
    }

    modifier onlyMafia() {
        require(
            isPlayer[msg.sender] && 
            players[playerIndex[msg.sender]].role == Role.MAFIA && 
            players[playerIndex[msg.sender]].isAlive, 
            "Only alive Mafia can vote"
        );
        _;
    }

    constructor() {
        currentPhase = Phase.LOBBY;
        playerCount = 0;
        aliveCount = 0;
        aliveMafiaCount = MAFIA_COUNT;
        aliveTownCount = TOWN_COUNT;
        gameStarted = false;
    }

    /**
     * @notice Join the game by paying entry fee
     * @dev First 2 players become Mafia, next 3 become Town
     */
    function joinGame() external payable {
        require(!gameStarted, "Game already started");
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(playerCount < MAX_PLAYERS, "Game is full");
        require(!isPlayer[msg.sender], "Already joined");

        uint256 index = playerCount;
        Role role = index < MAFIA_COUNT ? Role.MAFIA : Role.TOWN;

        players[index] = Player({
            addr: msg.sender,
            role: role,
            isAlive: true,
            hasCommittedVote: false,
            hasRevealedVote: false,
            hasVotedNight: false,
            voteCommitment: bytes32(0),
            dayVoteTarget: address(0),
            nightVoteTarget: address(0)
        });

        playerIndex[msg.sender] = index;
        isPlayer[msg.sender] = true;
        playerCount++;
        aliveCount++;

        emit PlayerJoined(msg.sender, index);

        if (playerCount == MAX_PLAYERS) {
            gameStarted = true;
            currentPhase = Phase.DAY_COMMIT;
            emit GameStarted();
            emit PhaseChanged(Phase.DAY_COMMIT);
        }
    }

    /**
     * @notice Commit a vote during day phase (commit-reveal scheme)
     * @param commitment keccak256(abi.encodePacked(target, salt))
     */
    function commitDayVote(bytes32 commitment) external 
        onlyPlayer 
        onlyAlive 
        onlyPhase(Phase.DAY_COMMIT) 
    {
        uint256 index = playerIndex[msg.sender];
        require(!players[index].hasCommittedVote, "Already committed");
        require(commitment != bytes32(0), "Invalid commitment");

        players[index].voteCommitment = commitment;
        players[index].hasCommittedVote = true;
        dayCommitCount++;

        emit VoteCommitted(msg.sender);

        if (dayCommitCount == aliveCount) {
            currentPhase = Phase.DAY_REVEAL;
            emit PhaseChanged(Phase.DAY_REVEAL);
        }
    }

    /**
     * @notice Reveal day vote
     * @param target The address voted for
     * @param salt The salt used in commitment
     */
    function revealDayVote(address target, uint256 salt) external 
        onlyPlayer 
        onlyAlive 
        onlyPhase(Phase.DAY_REVEAL) 
    {
        uint256 index = playerIndex[msg.sender];
        require(players[index].hasCommittedVote, "Must commit first");
        require(!players[index].hasRevealedVote, "Already revealed");
        
        bytes32 commitment = keccak256(abi.encodePacked(target, salt));
        require(commitment == players[index].voteCommitment, "Invalid reveal");
        require(isPlayer[target], "Target must be a player");

        players[index].dayVoteTarget = target;
        players[index].hasRevealedVote = true;
        dayRevealCount++;
        dayVotes[target]++;

        emit VoteRevealed(msg.sender, target);

        if (dayRevealCount == aliveCount) {
            _processDayResults();
        }
    }

    /**
     * @notice Mafia night vote to eliminate a town member
     * @param target Address to eliminate
     */
    function voteNightKill(address target) external 
        onlyMafia 
        onlyPhase(Phase.NIGHT) 
    {
        uint256 index = playerIndex[msg.sender];
        require(!players[index].hasVotedNight, "Already voted");
        require(isPlayer[target], "Target must be a player");
        require(players[playerIndex[target]].isAlive, "Target already dead");
        require(players[playerIndex[target]].role == Role.TOWN, "Can only kill Town");

        players[index].nightVoteTarget = target;
        players[index].hasVotedNight = true;
        nightVotes[target]++;
        nightVoteCount++;

        emit NightVoteCast(msg.sender, target);

        if (nightVoteCount == aliveMafiaCount) {
            _processNightResults();
        }
    }

    /**
     * @notice Force day tally (admin function or timer-based)
     * @dev Can be called if not all players reveal within time limit
     */
    function forceDayTally() external onlyPhase(Phase.DAY_REVEAL) {
        require(dayRevealCount > 0, "No reveals yet");
        _processDayResults();
    }

    /**
     * @notice Force night tally (admin function or timer-based)
     * @dev Can be called if not all Mafia vote within time limit
     */
    function forceNightTally() external onlyPhase(Phase.NIGHT) {
        require(nightVoteCount > 0, "No votes yet");
        _processNightResults();
    }

    /**
     * @notice Get caller's role (only for the caller themselves)
     * @return role The role of the calling player
     */
    function getMyRole() external view onlyPlayer returns (Role role) {
        return players[playerIndex[msg.sender]].role;
    }

    /**
     * @notice Get all players info
     * @return addrs Array of player addresses
     * @return alive Array of alive status
     * @return roles Array of player roles (only visible when game ended)
     */
    function getPlayers() external view returns (
        address[MAX_PLAYERS] memory addrs,
        bool[MAX_PLAYERS] memory alive,
        Role[MAX_PLAYERS] memory roles
    ) {
        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            addrs[i] = players[i].addr;
            alive[i] = players[i].isAlive;
            // Only reveal roles when game is ended
            if (currentPhase == Phase.ENDED) {
                roles[i] = players[i].role;
            }
        }
    }

    /**
     * @notice Get game state
     */
    function getGameState() external view returns (
        Phase phase,
        uint256 playersCount,
        uint256 alive,
        uint256 aliveMafia,
        uint256 aliveTown,
        bool started
    ) {
        return (currentPhase, playerCount, aliveCount, aliveMafiaCount, aliveTownCount, gameStarted);
    }

    /**
     * @notice Get winners when game ends
     * @return winners Array of winning addresses
     */
    function getWinners() external view returns (address[] memory winners) {
        require(currentPhase == Phase.ENDED, "Game not ended");
        
        uint256 winnerCount = winnerSide == Role.MAFIA ? aliveMafiaCount : aliveTownCount;
        winners = new address[](winnerCount);
        uint256 winnerIndex = 0;

        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            if (players[i].isAlive && players[i].role == winnerSide) {
                winners[winnerIndex] = players[i].addr;
                winnerIndex++;
            }
        }
    }

    /**
     * @notice Internal function to process day vote results
     */
    function _processDayResults() internal {
        address eliminated = _findMostVoted();
        
        if (eliminated != address(0)) {
            uint256 eliminatedIndex = playerIndex[eliminated];
            players[eliminatedIndex].isAlive = false;
            aliveCount--;
            
            if (players[eliminatedIndex].role == Role.MAFIA) {
                aliveMafiaCount--;
            } else {
                aliveTownCount--;
            }

            emit PlayerEliminated(eliminated, players[eliminatedIndex].role);
        }

        // Check win conditions
        if (_checkWinConditions()) {
            return;
        }

        // Reset for next round
        _resetDayVotes();
        currentPhase = Phase.NIGHT;
        emit PhaseChanged(Phase.NIGHT);
    }

    /**
     * @notice Internal function to process night vote results
     */
    function _processNightResults() internal {
        address eliminated = _findMostVotedNight();
        
        if (eliminated != address(0)) {
            uint256 eliminatedIndex = playerIndex[eliminated];
            players[eliminatedIndex].isAlive = false;
            aliveCount--;
            aliveTownCount--;

            emit PlayerEliminated(eliminated, players[eliminatedIndex].role);
        }

        // Check win conditions
        if (_checkWinConditions()) {
            return;
        }

        // Reset for next round
        _resetNightVotes();
        currentPhase = Phase.DAY_COMMIT;
        emit PhaseChanged(Phase.DAY_COMMIT);
    }

    /**
     * @notice Check win conditions and end game if met
     * @return gameEnded True if game has ended
     */
    function _checkWinConditions() internal returns (bool gameEnded) {
        if (aliveMafiaCount == 0) {
            // Town wins
            winnerSide = Role.TOWN;
            currentPhase = Phase.ENDED;
            emit PhaseChanged(Phase.ENDED);
            
            address[] memory winners = new address[](aliveTownCount);
            uint256 winnerIndex = 0;
            for (uint256 i = 0; i < MAX_PLAYERS; i++) {
                if (players[i].isAlive && players[i].role == Role.TOWN) {
                    winners[winnerIndex] = players[i].addr;
                    winnerIndex++;
                }
            }
            
            emit GameEnded(Role.TOWN, winners);
            _distributePrize();
            return true;
        } else if (aliveMafiaCount >= aliveTownCount) {
            // Mafia wins
            winnerSide = Role.MAFIA;
            currentPhase = Phase.ENDED;
            emit PhaseChanged(Phase.ENDED);
            
            address[] memory winners = new address[](aliveMafiaCount);
            uint256 winnerIndex = 0;
            for (uint256 i = 0; i < MAX_PLAYERS; i++) {
                if (players[i].isAlive && players[i].role == Role.MAFIA) {
                    winners[winnerIndex] = players[i].addr;
                    winnerIndex++;
                }
            }
            
            emit GameEnded(Role.MAFIA, winners);
            _distributePrize();
            return true;
        }
        return false;
    }

    /**
     * @notice Find most voted player in day voting
     */
    function _findMostVoted() internal view returns (address mostVoted) {
        uint256 maxVotes = 0;
        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            if (players[i].addr != address(0) && dayVotes[players[i].addr] > maxVotes) {
                maxVotes = dayVotes[players[i].addr];
                mostVoted = players[i].addr;
            }
        }
    }

    /**
     * @notice Find most voted player in night voting
     */
    function _findMostVotedNight() internal view returns (address mostVoted) {
        uint256 maxVotes = 0;
        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            if (players[i].addr != address(0) && nightVotes[players[i].addr] > maxVotes) {
                maxVotes = nightVotes[players[i].addr];
                mostVoted = players[i].addr;
            }
        }
    }

    /**
     * @notice Reset day voting state for next round
     */
    function _resetDayVotes() internal {
        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            players[i].hasCommittedVote = false;
            players[i].hasRevealedVote = false;
            players[i].voteCommitment = bytes32(0);
            players[i].dayVoteTarget = address(0);
            dayVotes[players[i].addr] = 0;
        }
        dayCommitCount = 0;
        dayRevealCount = 0;
    }

    /**
     * @notice Reset night voting state for next round
     */
    function _resetNightVotes() internal {
        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            players[i].hasVotedNight = false;
            players[i].nightVoteTarget = address(0);
            nightVotes[players[i].addr] = 0;
        }
        nightVoteCount = 0;
    }

    /**
     * @notice Distribute prize money to winners
     */
    function _distributePrize() internal {
        uint256 totalPrize = address(this).balance;
        uint256 winnerCount = winnerSide == Role.MAFIA ? aliveMafiaCount : aliveTownCount;
        uint256 prizePerWinner = totalPrize / winnerCount;

        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            if (players[i].isAlive && players[i].role == winnerSide) {
                payable(players[i].addr).transfer(prizePerWinner);
            }
        }
    }

    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Emergency function to get prize pool back (only if game is stuck)
     */
    function emergencyWithdraw() external {
        require(currentPhase == Phase.ENDED, "Game not ended");
        // This would only work if _distributePrize failed for some reason
        require(address(this).balance > 0, "No balance");
        
        uint256 refundPerPlayer = address(this).balance / MAX_PLAYERS;
        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            if (players[i].addr != address(0)) {
                payable(players[i].addr).transfer(refundPerPlayer);
            }
        }
    }
}
