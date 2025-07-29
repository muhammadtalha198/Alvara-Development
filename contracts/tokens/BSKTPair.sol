
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IFactory.sol";
import "../interfaces/IBSKTPair.sol";

contract BasketTokenStandardPair is ERC20Upgradeable, OwnableUpgradeable, IBSKTPair {
    
    using SafeERC20Upgradeable for IERC20Upgradeable;
   
    address public factory;
    uint256 public lastAccruedAt;
    bool public reentrancyGuardEntered;
    address[] private tokens;
    uint256[] private reserves;
    
    modifier nonReentrantReadOnly() { 
       
        if(reentrancyGuardEntered) 
            revert ReentrantCall();
        _;
    }
    
    modifier nonReentrant() { 
        if (reentrancyGuardEntered) 
            revert ReentrantCall(); 
            _; }
    
    event FeeAccrued(address indexed owner, uint256 months, uint256 supply, uint256 amount, uint256 newAccruedAt);
    event TokensUpdated(address[] _tokens);
    
    error InvalidToken();
    error InsufficientLiquidity();
    error InvalidRecipient();
    error EmptyStringParameter(string paramName);
    error ReentrantCall();

    function initialize(address _factoryAddress, string memory _name, address[] calldata _tokens) external initializer {
       
        if (_tokens.length == 0) revert InvalidToken();
        if (bytes(_name).length == 0) revert EmptyStringParameter("name");
       
        _name = string(abi.encodePacked(_name, "-LP"));
        __ERC20_init(_name, _name);
        __Ownable_init();
        tokens = _tokens;
        reserves = new uint256[](_tokens.length);
        factory = _factoryAddress;
        lastAccruedAt = block.timestamp;
    }

    function transferTokensToOwner() external onlyOwner {
        address ownerAddress = owner();
        for (uint256 i = 0; i < tokens.length; ++i) {
            address token = tokens[i];
            uint256 balance = reserves[i];
            if (balance > 0) IERC20Upgradeable(token).safeTransfer(ownerAddress, balance);
        }
    }

    function updateTokens(address[] calldata _tokens) external onlyOwner {
        if (_tokens.length == 0) revert InvalidToken();
        tokens = _tokens;
        _updateRebalanceReserve();
        emit TokensUpdated(_tokens);
    }

    function mint(address _to, uint256[] calldata amounts) external onlyOwner returns (uint256 liquidity) {
        
        if (_to == address(0)) revert InvalidRecipient();
        
        IFactory factoryInstance = IFactory(factory);
        address wethAddress = factoryInstance.weth();
        
        distMgmtFee();
        
        uint256 totalETH;
        
        for (uint256 i = 0; i < tokens.length; ++i) {
            address[] memory path = factoryInstance.getPath(tokens[i], wethAddress);
            totalETH += factoryInstance.getAmountsOut(amounts[i], path);
        }

        require (totalETH > 0, "totalETH zero in mint");
        
        liquidity = totalSupply() == 0 ? 1000 ether : calculateShareLP(totalETH);
        _mint(_to, liquidity);
        
        for (uint256 i = 0; i < amounts.length; ++i)
         reserves[i] += amounts[i];
    }

    function burn(address _to) external onlyOwner returns (uint256[] memory amounts) {
       
        if (_to == address(0)) revert InvalidRecipient();
        distMgmtFee();
       
        uint256 _liquidity = balanceOf(address(this));
        
        if (_liquidity == 0) revert InsufficientLiquidity();
        
        amounts = calculateShareTokens(_liquidity);
        _burn(address(this), _liquidity);
        
        for (uint256 i = 0; i < tokens.length; ++i) {
            uint256 amount = amounts[i];
            if (amount > 0) IERC20Upgradeable(tokens[i]).safeTransfer(_to, amount);
            reserves[i] -= amount;
        }
    }

    function setReentrancyGuardStatus(bool _state) external onlyOwner { reentrancyGuardEntered = _state; }

    function distMgmtFee() public {
       
        (uint256 months, uint256 supply, uint256 feeAmount) = calFee();
        
        if (months == 0) return;

        require(owner() != address(0), "Owner is  zero adrees sin bsktpair distMgmtFee");
        if (feeAmount > 0) _mint(owner(), feeAmount);
        
        lastAccruedAt += months * 30 days;
        
        emit FeeAccrued(owner(), months, supply, feeAmount, lastAccruedAt);
    }

    function calculateShareLP(uint256 _amountETH) public view nonReentrantReadOnly returns (uint256 amountLP) {
        uint256 reservedETH = _totalReservedETH();
        amountLP = reservedETH == 0 ? 1000 ether : (_amountETH * totalSupply()) / reservedETH;
    }

    function calculateShareETH(uint256 _amountLP) public view nonReentrantReadOnly returns (uint256 amountETH) {
        uint256 supply = totalSupply();
        if (supply == 0) return 0;
        IFactory factoryInstance = IFactory(factory);
        address wethAddress = factoryInstance.weth();
        for (uint256 i = 0; i < reserves.length; ++i) {
            uint256 tokenBalance = reserves[i];
            if (tokenBalance > 0) {
                address[] memory path = factoryInstance.getPath(tokens[i], wethAddress);
                uint256 share = (_amountLP * tokenBalance) / supply;
                amountETH += factoryInstance.getAmountsOut(share, path);
            }
        }
    }

    function calculateShareTokens(uint256 _amountLP) public view nonReentrantReadOnly returns (uint256[] memory amountTokens) {
        uint256 supply = totalSupply();
        amountTokens = new uint256[](tokens.length);
        if (supply == 0) return amountTokens;
        for (uint256 i = 0; i < reserves.length; ++i) amountTokens[i] = (_amountLP * reserves[i]) / supply;
    }

    function getTokenAndUserBal(address _user) public view nonReentrantReadOnly returns (uint256[] memory _tokenBal, uint256 _supply, uint256 _userLP) {
        _tokenBal = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; ++i) _tokenBal[i] = reserves[i];
        _supply = totalSupply();
        _userLP = balanceOf(_user);
    }

    function calFee() public view returns (uint256 months, uint256 supply, uint256 feeAmount) {
        months = (block.timestamp - lastAccruedAt) / 30 days;
        supply = totalSupply();
        if (months == 0 || supply == 0) return (months, supply, 0);
        feeAmount = IFactory(factory).calMgmtFee(months, supply);
    }

    function getTokenAddress(uint256 _index) external view nonReentrantReadOnly returns (address) { 
        return tokens[_index]; 
    }

    function getTokenReserve(uint256 _index) external view nonReentrantReadOnly returns (uint256) { 
        return reserves[_index]; 
    }

    function getTokenList() public view nonReentrantReadOnly returns (address[] memory) { 
        return tokens; 
    }

    function getTokensReserve() public view nonReentrantReadOnly returns (uint256[] memory) { 
        return reserves; 
    }

    function getTotalMgmtFee() external view returns (uint256) {
        (, , uint256 feeAmount) = calFee(); 
        return feeAmount + balanceOf(owner()); 
    }

    function _factory() private view returns (IFactory) { 
        return IFactory(factory); 
    }

    function _updateRebalanceReserve() private {
        
        reserves = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; ++i) 
        reserves[i] = IERC20Upgradeable(tokens[i]).balanceOf(address(this));
    }

    function _totalReservedETH() private view returns (uint256 totalReservedETH) {
        IFactory factoryInstance = IFactory(factory);
        address weth = factoryInstance.weth();
        for (uint256 i = 0; i < reserves.length; ++i) {
            uint256 reserve = reserves[i];
            if (reserve > 0) {
                address[] memory path = factoryInstance.getPath(tokens[i], weth);
                totalReservedETH += factoryInstance.getAmountsOut(reserve, path);
            }
        }
    }

    function getOwner() external view returns (address) {
        return owner();
    }
}