
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "hardhat/console.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function burn(uint256 amount) external; 

    function burnTokens(address account, uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;

    function mint(address account, uint256 amount) external;
}



contract AlvaStaking is Initializable, PausableUpgradeable, AccessControlUpgradeable {
    IERC20 private ALVA;
    IERC20 private veALVA;

    uint private constant RATIO_FACTOR = 10 ** 8;
    uint private constant PERCENTAGE_FACTOR = 10 ** 7;
    uint private constant REWARD_PERIOD = 5 minutes;

    bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 private constant REWARDS_ALLOCATOR_ROLE = keccak256("REWARDS_ALLOCATOR_ROLE");

    struct poolData {
        bool status;
        uint veAlvaRatio;
        uint poolPercentage;
        uint duration;
        uint amountLocked;
        uint rewardPeriods;
    }

    struct Stake {
        string pool;
        uint amount;
        bool isForever;
        bool isActive;
        uint duration;
        uint startTime;
        uint endTime;
        uint votingPower;
        uint rewardsCurrent;
        uint openingRewardId;
        uint closingRewardId;
        uint totalIncremented;
        mapping(uint => uint) rewardIdToIncrementedAmount;
    }

    struct rewardData {
        bool isProcessed;
        uint timestamp;
        uint amount;
        mapping(string => uint) poolToAmountLocked;
        mapping(string => uint) poolToNewAmount;
        mapping(string => uint) poolToExpiredAmount;
    }

    string[] public Pools;
    uint public stakeId;
    uint public currentIdRewards;
    uint public decayInterval;
    uint public minimumStakingAmount;
    uint public minimumRewardAmount;
    uint public vaultWithdrawalPercentage;
    uint public startTime;
    uint public unallocatedRewards;

    mapping(address => uint[]) public userStakeIds;
    mapping(address => uint[]) public rewardEligibleIds;
    
    mapping(address => uint) public claimedRewardId;
    mapping(address => uint) public userReward;
    mapping(address => uint) public foreverStakeId;
    
    mapping(string => poolData) public poolInfo;
    mapping(uint => Stake) public stakeInfo;
    mapping(uint => rewardData) public rewardInfo;

    event TokensStaked(uint indexed _stakeId, address indexed account, uint amount, string pool, uint veAlva);
    event StakedAmountIncreased(uint indexed _stakeId, uint amount, uint veAlva);
    event LockRenewed(uint indexed previousLockId, uint indexed newLockId);
    event Compounded(uint indexed _stakeId, uint amount, uint rewardAmount, uint veAlva);
    event Withdrawn(address indexed account, uint indexed _stakeId, uint endTime);
    event RewardsClaimed(address indexed account, uint rewardAmount);
    event RewardsAdded(uint indexed rewardId, uint amount);
    event RewardsCorrected(address indexed account, uint rewardAmount);

    constructor() {
        // _disableInitializers();
    }

    //["FOREVER","FiveMinutes"]
    // [4000000,6000000]
    // [200000000,150000000]
    // [0,14400];  
   
    // [0,1500];   cycles 
    // [999999,8]; REWARD_PERIOD = 3 minutes.
 

    // [999999,48]; REWARD_PERIOD = 5 minutes.
    // [999999,24]; REWARD_PERIOD = 10 minutes.

    //["FOREVER","TenMinutes"]
    // [200000000,150000000]
    // [0,86400];   
    // [999999,144]

    function initialize(
        address _alva,
        address _veAlva,
        uint _decayInterval,
        uint _startTime,
        string[] memory _pools,
        uint[] memory rewards,
        uint[] memory veTokenRatio,
        uint[] memory duration,
        uint[] memory rewardPeriods
    ) external initializer {
        require(_alva != address(0), "Invalid ALVA token address");
        require(_veAlva != address(0), "Invalid veALVA token address");

        ALVA = IERC20(_alva); 
        veALVA = IERC20(_veAlva);
        decayInterval = _decayInterval;
        startTime = _startTime;
        minimumStakingAmount = 1;
        minimumRewardAmount = 10000;
        vaultWithdrawalPercentage = 5000000;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REWARDS_ALLOCATOR_ROLE, msg.sender);

        require(duration[0] == 0, "Invalid Durations");

        uint totalRewardPercentage;
        Pools = _pools;

        for (uint i; i < _pools.length; i++) {
            poolInfo[_pools[i]].veAlvaRatio = veTokenRatio[i];
            poolInfo[_pools[i]].poolPercentage = rewards[i];
            poolInfo[_pools[i]].duration = duration[i];
            poolInfo[_pools[i]].status = true;
            poolInfo[_pools[i]].rewardPeriods = rewardPeriods[i];
            totalRewardPercentage += rewards[i];
        }
        require(totalRewardPercentage == PERCENTAGE_FACTOR, "Invalid Rewards");
    }

    function stake(uint amount, string memory _poolName) public whenNotPaused {
        require(amount >= minimumStakingAmount, "Amount is below the minimum required");
        _stake(amount, 0, 0, _poolName, rewardPeriodCount());
    }

    function _stake(
        uint amountNew,
        uint amountOld,
        uint votingPowerOld,
        string memory _poolName,
        uint _rewardPeriodCount
    ) internal {

        require(poolInfo[_poolName].status, "The _poolName is not available for staking");

        stakeId++;

        uint rewardIdExpired = _rewardPeriodCount + poolInfo[_poolName].rewardPeriods;
        uint amountTotal = amountNew + amountOld;
        uint votingPowerTotal = getveAlvaAmount(amountTotal, _poolName);

        if (votingPowerTotal > votingPowerOld)
            veALVA.mint(msg.sender, votingPowerTotal - votingPowerOld);

        if (poolInfo[_poolName].duration != 0) {
            
            require(getActiveLockId(msg.sender) == 0, "Timebase lock already exists");

            userStakeIds[msg.sender].push(stakeId);

            if (poolInfo[_poolName].poolPercentage > 0)
                rewardEligibleIds[msg.sender].push(stakeId);

            if (amountNew > 0)
                ALVA.transferFrom(msg.sender, address(this), amountNew);

            rewardInfo[rewardIdExpired].poolToExpiredAmount[_poolName] += amountTotal;
        } else {
            require(foreverStakeId[msg.sender] == 0, "Forever lock already exists");

            foreverStakeId[msg.sender] = stakeId;
            stakeInfo[stakeId].isForever = true;
            ALVA.burnFrom(msg.sender, amountTotal);
        }

        stakeInfo[stakeId].pool = _poolName;
        stakeInfo[stakeId].amount = amountTotal;
        stakeInfo[stakeId].duration = poolInfo[_poolName].duration;
        stakeInfo[stakeId].startTime = block.timestamp;
        stakeInfo[stakeId].endTime = block.timestamp + poolInfo[_poolName].duration;
        stakeInfo[stakeId].votingPower = votingPowerTotal;
        stakeInfo[stakeId].isActive = true;
        stakeInfo[stakeId].openingRewardId = _rewardPeriodCount;
        stakeInfo[stakeId].closingRewardId = rewardIdExpired;

        rewardInfo[_rewardPeriodCount].poolToNewAmount[_poolName] += amountTotal;

        emit TokensStaked(stakeId, msg.sender, amountTotal, _poolName, votingPowerTotal);
    }
    // 0xdD870fA1b7C4700F2BD7f44238821C26f7392148

    function claimRewards() public whenNotPaused {
        
        uint reward = _claimRewards();
        ALVA.transfer(msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, reward);
    }

    function _claimRewards() internal returns (uint reward) {
        
        if (rewardEligibleIds[msg.sender].length > claimedRewardId[msg.sender]) {
            _finalizeTimeBaseRewards(rewardEligibleIds[msg.sender][claimedRewardId[msg.sender]]);
        }

        _finalizeForeverLockRewards();
        reward = userReward[msg.sender];

        require(reward > 0, "No rewards available for claiming");
        userReward[msg.sender] = 0;
    }

    function _finalizeTimeBaseRewards(uint _stakeId) internal {
        
        if (_stakeId != 0 && stakeInfo[_stakeId].openingRewardId < stakeInfo[_stakeId].closingRewardId) {

            uint rewardAmount;
            uint incrementedAmount;
            
            (rewardAmount, stakeInfo[_stakeId].openingRewardId, incrementedAmount) = countRewards(_stakeId, 10);

            stakeInfo[_stakeId].rewardsCurrent += rewardAmount;
            userReward[msg.sender] += rewardAmount;
            

            stakeInfo[_stakeId].rewardIdToIncrementedAmount[stakeInfo[_stakeId].openingRewardId] = incrementedAmount;

            if (stakeInfo[_stakeId].openingRewardId == stakeInfo[_stakeId].closingRewardId) {
                claimedRewardId[msg.sender]++;
            }
        }
    }

    function _finalizeForeverLockRewards() internal {
        uint _stakeId = foreverStakeId[msg.sender];
        if (_stakeId != 0 && stakeInfo[_stakeId].openingRewardId < currentIdRewards) {
            uint rewardAmount;
            uint incrementedAmount;
            (rewardAmount, stakeInfo[_stakeId].openingRewardId, incrementedAmount) = countRewards(_stakeId, 10);

            stakeInfo[_stakeId].rewardsCurrent += rewardAmount;
            userReward[msg.sender] += rewardAmount;
            stakeInfo[_stakeId].rewardIdToIncrementedAmount[stakeInfo[_stakeId].openingRewardId] = incrementedAmount;
        }
    }

    function countRewards(uint _stakeId, uint batchSize) public view returns (uint rewardAmount, uint openingRewardId, uint incrementedAmount) {
        
        Stake storage _stakeData = stakeInfo[_stakeId];

        require(_stakeData.amount > 0, "Invalid Lock Id");

        uint closingId = _stakeData.isForever ? currentIdRewards : _stakeData.closingRewardId;

        openingRewardId = _stakeData.openingRewardId;

        uint endingId = openingRewardId + batchSize;

        incrementedAmount = _stakeData.rewardIdToIncrementedAmount[openingRewardId];

        for (; endingId > openingRewardId && closingId > openingRewardId; openingRewardId++) {

            if (rewardInfo[openingRewardId].timestamp == 0) break;
            rewardAmount += _calculateRewards(openingRewardId, _stakeId, incrementedAmount);

            if (_stakeData.rewardIdToIncrementedAmount[openingRewardId] > 0)
                incrementedAmount = _stakeData.rewardIdToIncrementedAmount[openingRewardId];
        }


    }

    function _calculateRewards(uint rewardId, uint _stakeId, uint incrementedAmount) internal view returns (uint rewards) {
        
        string memory pool = stakeInfo[_stakeId].pool;

        uint amountAtGivenRewardId = stakeInfo[_stakeId].amount - (stakeInfo[_stakeId].totalIncremented - incrementedAmount);

        rewards = (((rewardInfo[rewardId].amount * poolInfo[pool].poolPercentage) * amountAtGivenRewardId) /
                rewardInfo[rewardId].poolToAmountLocked[pool]) / PERCENTAGE_FACTOR;
    }

    

    
    function topUpRewards() public /*onlyRole(REWARDS_ALLOCATOR_ROLE)*/ whenNotPaused {
       
        uint amount = (ALVA.balanceOf(msg.sender) * vaultWithdrawalPercentage) / PERCENTAGE_FACTOR;

        require(amount >= minimumRewardAmount,"Reward must be at least the minimum amount");

        uint _currentIdRewards = currentIdRewards;
        require(_currentIdRewards < rewardPeriodCount(),"Cannot process before time");

        ALVA.transferFrom(msg.sender, address(this), amount);

        uint _unallocatedRewards = unallocatedRewards;
        amount += _unallocatedRewards;
        _unallocatedRewards = 0;

        rewardInfo[_currentIdRewards].amount = amount;
        rewardInfo[_currentIdRewards].timestamp = startTime + ((_currentIdRewards + 1) * REWARD_PERIOD);

        for (uint i = 0; i < Pools.length; i++) {
            poolInfo[Pools[i]].amountLocked += rewardInfo[_currentIdRewards].poolToNewAmount[Pools[i]];

            if (i != 0) 
                poolInfo[Pools[i]].amountLocked -= rewardInfo[_currentIdRewards].poolToExpiredAmount[Pools[i]];

            rewardInfo[_currentIdRewards].poolToAmountLocked[Pools[i]] = poolInfo[Pools[i]].amountLocked;

            if (poolInfo[Pools[i]].amountLocked == 0) 
                _unallocatedRewards +=(amount * poolInfo[Pools[i]].poolPercentage) /PERCENTAGE_FACTOR;

        }

        unallocatedRewards = _unallocatedRewards;

        emit RewardsAdded(_currentIdRewards, amount);
        rewardInfo[_currentIdRewards].isProcessed = true;
        currentIdRewards++;
    }



    function increaseAmount(uint amount, bool isForever) public whenNotPaused {
        
        uint _stakeId;

        if (isForever) {
            _stakeId = foreverStakeId[msg.sender];
            require(_stakeId != 0, "No active forever lock exists for the user");
            ALVA.burnFrom(msg.sender, amount);

        } else {
           
            _stakeId = getActiveLockId(msg.sender);
            require(_stakeId != 0 && stakeInfo[_stakeId].endTime > block.timestamp, "No Active lock exists");
            
            ALVA.transferFrom(msg.sender, address(this), amount);
        }

        _increaseAmount(amount, _stakeId);

        emit StakedAmountIncreased(
            _stakeId,
            stakeInfo[_stakeId].amount,
            stakeInfo[_stakeId].votingPower
        );
    }

    function _increaseAmount(uint amount, uint _stakeId) internal {
        
        require(amount >= minimumStakingAmount, "Amount is below the minimum required");

        string memory poolActiveLock = stakeInfo[_stakeId].pool;
        require(poolInfo[poolActiveLock].status, "Pool is currently disabled");

        // Finalize pending rewards before increasing stake
        if (stakeInfo[_stakeId].isForever) {
            _finalizeForeverLockRewards();
        } else {
            _finalizeTimeBaseRewards(_stakeId);
        }

        uint veALVANew = getveAlvaAmount(amount, poolActiveLock);
        veALVA.mint(msg.sender, veALVANew);

        stakeInfo[_stakeId].amount += amount;
        stakeInfo[_stakeId].votingPower += veALVANew;
        stakeInfo[_stakeId].totalIncremented += amount;

        uint _currentRewardPeriod = rewardPeriodCount();
        uint closingRewardId = stakeInfo[_stakeId].closingRewardId;

        // Update openingRewardId to current period to ensure immediate reward reflection
        stakeInfo[_stakeId].openingRewardId = _currentRewardPeriod;

        // Update reward data for current and closing periods
        if (closingRewardId >= _currentRewardPeriod || stakeInfo[_stakeId].isForever) {
            rewardInfo[_currentRewardPeriod].poolToNewAmount[poolActiveLock] += amount;
            rewardInfo[closingRewardId].poolToExpiredAmount[poolActiveLock] += amount;
            // Update poolToAmountLocked to reflect the incremented amount immediately
            if (rewardInfo[_currentRewardPeriod].isProcessed) {
                rewardInfo[_currentRewardPeriod].poolToAmountLocked[poolActiveLock] += amount;
            }
        }

        // Store total incremented amount for the current reward period
        stakeInfo[_stakeId].rewardIdToIncrementedAmount[_currentRewardPeriod] = stakeInfo[_stakeId].totalIncremented;
    }

    function renewStaking(uint amount, string memory pool) public whenNotPaused {
        
        uint activeLock = getActiveLockId(msg.sender);

        require(activeLock != 0 && stakeInfo[activeLock].endTime > block.timestamp, "No active lock found");
        require(poolInfo[pool].duration >= stakeInfo[activeLock].duration, "Lock duration cannot be less than existing lock");

        uint previousAmount = stakeInfo[activeLock].amount;
        string memory poolActiveLock = stakeInfo[activeLock].pool;

        stakeInfo[activeLock].isActive = false;
        stakeInfo[activeLock].endTime = block.timestamp;

        uint _rewardPeriodCount = rewardPeriodCount();

        if (stakeInfo[activeLock].closingRewardId > _rewardPeriodCount) {
            rewardInfo[stakeInfo[activeLock].closingRewardId].poolToExpiredAmount[poolActiveLock] -= previousAmount;
            stakeInfo[activeLock].closingRewardId = _rewardPeriodCount;
            rewardInfo[_rewardPeriodCount].poolToExpiredAmount[poolActiveLock] += previousAmount;

            if (stakeInfo[activeLock].openingRewardId == stakeInfo[activeLock].closingRewardId &&
                rewardEligibleIds[msg.sender].length > 0) {
                rewardEligibleIds[msg.sender].pop();
            }
        }

        _stake(
            amount,
            previousAmount,
            stakeInfo[activeLock].votingPower,
            pool,
            _rewardPeriodCount
        );

        emit LockRenewed(activeLock, stakeId);
    }

    function unstake() public whenNotPaused {
        uint activeLock = getActiveLockId(msg.sender);
        require(activeLock != 0, "No active lock found");
        require(block.timestamp > stakeInfo[activeLock].endTime, "Cannot unstake before the lock end time");

        ALVA.transfer(msg.sender, stakeInfo[activeLock].amount);
        veALVA.burnTokens(msg.sender, stakeInfo[activeLock].votingPower);
        stakeInfo[activeLock].isActive = false;

        emit Withdrawn(
            msg.sender,
            activeLock,
            stakeInfo[activeLock].endTime
        );
    }

    

    function compoundRewards(bool isForever) public whenNotPaused {
        uint reward = _claimRewards();

        uint _stakeId;
        if (isForever) {
            _stakeId = foreverStakeId[msg.sender];
            require(_stakeId != 0, "No active forever lock exists for the user");
            ALVA.burn(reward);
        } else {
            _stakeId = getActiveLockId(msg.sender);
            require(
                _stakeId != 0 &&
                    stakeInfo[_stakeId].endTime > block.timestamp,
                "No Active lock exists"
            );
        }

        _increaseAmount(reward, _stakeId);

        emit Compounded(
            _stakeId,
            stakeInfo[_stakeId].amount,
            reward,
            stakeInfo[_stakeId].votingPower
        );
    }



    function updateMinimumRewardAmount(uint amount) public onlyRole(ADMIN_ROLE) {
        minimumRewardAmount = amount;
    }

    function updatePoolStatus(string memory pool, bool status) public onlyRole(ADMIN_ROLE) {
        
        bool exists = false;
        
        uint length = Pools.length;
        
        for (uint256 i = 0; i < length; i++) {
           
            if (keccak256(abi.encodePacked(Pools[i])) == keccak256(abi.encodePacked(pool))) {
                exists = true;
                break;
            }
        }
        require(exists, "Pool does not exist");

        poolInfo[pool].status = status;
    }

    function updateMinStakingAmount(uint amount) public onlyRole(ADMIN_ROLE) {
        require(amount >= 1, "Minimum amount must be at least 1");
        minimumStakingAmount = amount;
    }

    function updateWithdrawalPercentage(uint amount) public onlyRole(ADMIN_ROLE) {
        require(amount <= PERCENTAGE_FACTOR, "Invalid percentage value");
        vaultWithdrawalPercentage = amount;
    }

    function updateDecayInterval(uint newInterval) public onlyRole(ADMIN_ROLE) {
        require(newInterval > 0 && newInterval <= 1 weeks, "Interval should be within the valid range");
        decayInterval = newInterval;
    }

    function getRewardsPending(address account) public view returns (uint totalReward) {
        uint timebaseReward;
        uint foreverLockReward;
        uint currentIndex = claimedRewardId[account];

        for (currentIndex; currentIndex < rewardEligibleIds[account].length; currentIndex++) {
            (uint reward, , ) = countRewards(
                rewardEligibleIds[account][currentIndex],
                stakeInfo[rewardEligibleIds[account][currentIndex]].closingRewardId -
                    stakeInfo[rewardEligibleIds[account][currentIndex]].openingRewardId
            );
            timebaseReward += reward;
        }

        if (
            foreverStakeId[account] > 0 &&
            currentIdRewards > stakeInfo[foreverStakeId[account]].openingRewardId
        ) {
            (foreverLockReward, , ) = countRewards(
                foreverStakeId[account],
                currentIdRewards - stakeInfo[foreverStakeId[account]].openingRewardId
            );
        }

        totalReward = timebaseReward + foreverLockReward + userReward[account];
    }

    function veAlvaBalance(address account) external view returns (uint) {
        uint activeLock = getActiveLockId(account);
        uint balance = stakeInfo[activeLock].votingPower;

        if (stakeInfo[activeLock].startTime > 0) {
            uint intervalsPassed = (block.timestamp - stakeInfo[activeLock].startTime) / decayInterval;
            uint totalIntervals = stakeInfo[activeLock].duration / decayInterval;
            if (totalIntervals > intervalsPassed) {
                balance = (balance * (totalIntervals - intervalsPassed)) / totalIntervals;
            } else {
                balance = 0;
            }
        }

        return balance + stakeInfo[foreverStakeId[account]].votingPower;
    }

    function getIncrementedAmount(uint _stakeId, uint rewardId) external view returns (uint amount) {
        amount = stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId];
    }

    function getPoolDataByRewardId(uint rewardId, string memory pool) external view returns (
        uint poolToAmountLocked,
        uint poolToNewAmount,
        uint poolToExpiredAmount
    ) {
        return (
            rewardInfo[rewardId].poolToAmountLocked[pool],
            rewardInfo[rewardId].poolToNewAmount[pool],
            rewardInfo[rewardId].poolToExpiredAmount[pool]
        );
    }

    function getTotalLocks(address account) external view returns (uint userLocksTotal, uint userRewardEligibleLocks) {
        userLocksTotal = rewardEligibleIds[account].length;
        userRewardEligibleLocks = userStakeIds[account].length;
    }

    function rewardPeriodCount() public view returns (uint) {
        return (block.timestamp - startTime) / REWARD_PERIOD;
    }

    function getveAlvaAmount(uint amount, string memory pool) public view returns (uint) {
        return (amount * poolInfo[pool].veAlvaRatio) / RATIO_FACTOR;
    }

    function getActiveLockId(address account) public view returns (uint timebaseId) {
        uint locksLength = userStakeIds[account].length;
        if (locksLength > 0) {
            if (stakeInfo[userStakeIds[account][locksLength - 1]].isActive) {
                timebaseId = userStakeIds[account][locksLength - 1];
            }
        }
    }

    function resetRewardID() external{
        currentIdRewards = 0;
    }
    
    function resetStarttime(uint256 time) external{
        startTime = time;
    }
}



/// @notice Admin-only function to retroactively correct rewards for a user’s locks by updating poolToAmountLocked and recalculating rewards.
    // /// @dev Updates poolToAmountLocked for past periods where increments occurred, recalculates rewards, and advances openingRewardId.
    // function correctRewards(address account) public onlyRole(ADMIN_ROLE) {
    //     uint rewardAmount;

    //     uint currentIndex = claimedRewardId[account];
    //     for (currentIndex; currentIndex < rewardEligibleIds[account].length; currentIndex++) {
    //         uint _stakeId = rewardEligibleIds[account][currentIndex];
    //         if (stakeInfo[_stakeId].openingRewardId < stakeInfo[_stakeId].closingRewardId) {
    //             uint incrementedAmount = stakeInfo[_stakeId].rewardIdToIncrementedAmount[stakeInfo[_stakeId].openingRewardId];
    //             for (uint rewardId = stakeInfo[_stakeId].openingRewardId; rewardId < stakeInfo[_stakeId].closingRewardId; rewardId++) {
    //                 if (rewardInfo[rewardId].isProcessed) {
    //                     string memory pool = stakeInfo[_stakeId].pool;
    //                     if (stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId] > incrementedAmount) {
    //                         uint increment = stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId] - incrementedAmount;
    //                         rewardInfo[rewardId].poolToAmountLocked[pool] += increment;
    //                         incrementedAmount = stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId];
    //                     }
    //                     rewardAmount += _calculateRewards(rewardId, _stakeId, incrementedAmount);
    //                 }
    //             }

    //             stakeInfo[_stakeId].rewardsCurrent += rewardAmount;
    //             userReward[account] += rewardAmount;
    //             stakeInfo[_stakeId].openingRewardId = stakeInfo[_stakeId].closingRewardId;
    //             claimedRewardId[account]++;
    //         }
    //     }

    //     uint foreverLockId = foreverStakeId[account];
    //     if (foreverLockId != 0 && stakeInfo[foreverLockId].openingRewardId < currentIdRewards) {
    //         uint incrementedAmount = stakeInfo[foreverLockId].rewardIdToIncrementedAmount[stakeInfo[foreverLockId].openingRewardId];
    //         for (uint rewardId = stakeInfo[foreverLockId].openingRewardId; rewardId < currentIdRewards; rewardId++) {
    //             if (rewardInfo[rewardId].isProcessed) {
    //                 string memory pool = stakeInfo[foreverLockId].pool;
    //                 if (stakeInfo[foreverLockId].rewardIdToIncrementedAmount[rewardId] > incrementedAmount) {
    //                     uint increment = stakeInfo[foreverLockId].rewardIdToIncrementedAmount[rewardId] - incrementedAmount;
    //                     rewardInfo[rewardId].poolToAmountLocked[pool] += increment;
    //                     incrementedAmount = stakeInfo[foreverLockId].rewardIdToIncrementedAmount[rewardId];
    //                 }
    //                 rewardAmount += _calculateRewards(rewardId, foreverLockId, incrementedAmount);
    //             }
    //         }
    //         stakeInfo[foreverLockId].rewardsCurrent += rewardAmount;
    //         userReward[account] += rewardAmount;
    //         stakeInfo[foreverLockId].openingRewardId = currentIdRewards;
    //     }

    //     if (rewardAmount > 0) {
    //         emit RewardsCorrected(account, rewardAmount);
    //     }0x4aB10750CC2A1Ce3a92445d322b94B33831e57De
    // }
