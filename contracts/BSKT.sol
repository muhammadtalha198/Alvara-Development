
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./interfaces/IBSKTPair.sol";
import "./interfaces/IFactory.sol";
import "./interfaces/IUniswap.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IBSKT.sol";

contract BasketTokenStandard is
    ERC721URIStorageUpgradeable,
    IERC2981Upgradeable,
    ReentrancyGuardUpgradeable,
    IBSKT
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct TokenDetails {
        address[] tokens;
        uint256[] weights;
    }

    bytes4 private constant INTERFACE_ID_ERC2981 = 0x2a55205a;

    uint256 public constant PERCENT_PRECISION = 10000;

    address public bsktPair;

    address public factory;

    string public id;

    string public description;

    mapping(bytes4 => bool) private _supportedInterfaces;

    TokenDetails private _tokenDetails;

    

    // struct BasketParams {
    //     string name;
    //     string symbol;
    //     address owner;
    //     address factoryAddress;
    //     address[] tokens;
    //     uint256[] weights;
    //     address bsktPair;
    //     string tokenURI;
    //     string id;
    //     string description;
    // }

    function initialize(BasketParams calldata params)
        external
        checkLength(params.tokens.length, params.weights.length)
        initializer
    {
        __ERC721_init(params.name, params.symbol);
        _registerInterface(INTERFACE_ID_ERC2981);
        __ReentrancyGuard_init();

        factory = params.factoryAddress;
        id = params.id;
        _checkValidTokensAndWeights(params.tokens, params.weights);

        bsktPair = params.bsktPair;

        _tokenDetails.tokens = params.tokens;
        _tokenDetails.weights = params.weights;

        description = params.description;

        _safeMint(params.owner, 0);
        _setTokenURI(0, params.tokenURI);
    }

    receive() external payable {
        if (!isContractAddress(msg.sender))
            revert UnauthorizedSender(msg.sender);
    }

    function _validateContributeInputs(uint256 _buffer, uint256 _deadline) private view {
        if (_buffer == 0 || _buffer >= 5000) {
            revert InvalidBuffer(_buffer, 1, 4999);
        }
        if (msg.value == 0) revert ZeroContributionAmount();
        if (_deadline <= block.timestamp) revert DeadlineInPast(_deadline);
    }

    function _deductContributionFee(uint256 contributionFee, address feeCollector, uint256 value)
        private
        returns (uint256)
    {
        uint256 feeAmount = 0;
        if (contributionFee > 0) {
            feeAmount = (value * contributionFee) / PERCENT_PRECISION;
            (bool success, ) = payable(feeCollector).call{value: feeAmount}("");
            require(success, "Failed to deduct Contribution Fee");
            emit PlatformFeeDeducted(
                feeAmount,
                contributionFee,
                feeCollector,
                "contribute"
            );
        }
        return feeAmount;
    }

    function _swapEthForTokens(
        uint256 amountInMin,
        address token,
        address wethAddress,
        address routerAddress,
        uint256 buffer,
        uint256 deadline
    ) private returns (uint256) {
        address[] memory path = _factory().getPath(wethAddress, token);
        uint256 amountOutMin = (_factory().getAmountsOut(amountInMin, path) * 
            (PERCENT_PRECISION - buffer)) / PERCENT_PRECISION;
        uint256 balance = IERC20Upgradeable(token).balanceOf(bsktPair);

        IUniswapV2Router(routerAddress)
            .swapExactETHForTokensSupportingFeeOnTransferTokens{ value: amountInMin }(
                amountOutMin,
                path,
                bsktPair,
                deadline
            );

        return IERC20Upgradeable(token).balanceOf(bsktPair) - balance;
    }

    function _initializeContribute()
        private
        returns (
            uint256 amountAfterFee,
            address wethAddress,
            address routerAddress,
            uint256 tokensLength,
            uint256[] memory amounts
        )
    {
        IFactory factoryInstance = _factory();
        (, uint256 contributionFee, , address feeCollector) = factoryInstance.getPlatformFeeConfig();

        uint256 feeAmount = _deductContributionFee(contributionFee, feeCollector, msg.value);

        amountAfterFee = msg.value - feeAmount;
        wethAddress = factoryInstance.weth();
        routerAddress = factoryInstance.router();
        tokensLength = _tokenDetails.tokens.length;
        amounts = new uint256[](tokensLength);

        return (amountAfterFee, wethAddress, routerAddress, tokensLength, amounts);
    }

    function contribute(uint256 _buffer, uint256 _deadline) external payable nonReentrant {

        _validateContributeInputs(_buffer, _deadline);

        (
            uint256 amountAfterFee,
            address wethAddress,
            address routerAddress,
            uint256 tokensLength,
            uint256[] memory amounts
        ) = _initializeContribute();

        uint256 totalAllocated;

        for (uint256 i = 0; i < tokensLength; ) {
            uint256 weight = _tokenDetails.weights[i];
            uint256 amountInMin;

            if (i == tokensLength - 1) {
                amountInMin = amountAfterFee - totalAllocated;
            } else {
                amountInMin = (amountAfterFee * weight) / PERCENT_PRECISION;
                totalAllocated += amountInMin;
            }

            amounts[i] = _swapEthForTokens(
                amountInMin,
                _tokenDetails.tokens[i],
                wethAddress,
                routerAddress,
                _buffer,
                _deadline
            );

            unchecked {
                ++i;
            }
        }

        IBSKTPair(bsktPair).mint(msg.sender, amounts);
        emit ContributedToBSKT(address(this), msg.sender, msg.value);
    }

    function withdraw(
        uint256 _liquidity,
        uint256 _buffer,
        uint256 _deadline
    ) private nonReentrant validateMinLpWithdrawal(_liquidity) {
        if (_buffer == 0 || _buffer >= 5000) {
            revert InvalidBuffer(_buffer, 1, 4999);
        }

        IFactory factoryInstance = _factory(); 
        (, , uint256 withdrawalFee, address feeCollector) = factoryInstance
            .getPlatformFeeConfig();

        uint256 feeLiquidity = 0;

        if (withdrawalFee > 0) {
            feeLiquidity = (_liquidity * withdrawalFee) / PERCENT_PRECISION;

            uint256[] memory feeAmounts = _withdraw(
                feeLiquidity,
                address(this)
            );
            uint256 ethAmount = _tokensToEth(
                factoryInstance,
                feeAmounts,
                payable(feeCollector),
                _buffer,
                _deadline
            );
            emit PlatformFeeDeducted(
                ethAmount,
                withdrawalFee,
                feeCollector,
                "withdrawTokens"
            );
        }

        uint256 userLiquidity = _liquidity - feeLiquidity;

        uint256[] memory userAmounts = _withdraw(userLiquidity, msg.sender);

        emit WithdrawnFromBSKT(
            address(this),
            msg.sender,
            _tokenDetails.tokens,
            userAmounts
        );
    }

    function _tokensToEth(
        IFactory factoryInstance,
        uint256[] memory _amounts,
        address payable _receiver,
        uint256 _buffer,
        uint256 _deadline
    ) private returns (uint256 totalETH) {
        if (_deadline <= block.timestamp) revert DeadlineInPast(_deadline);

        address wethAddress = factoryInstance.weth(); 
        address routerAddress = factoryInstance.router(); 
        uint256 totalWETH = 0;

        for (uint256 i = 0; i < _amounts.length; ) {
            if (_amounts[i] > 0) {
                if (_tokenDetails.tokens[i] == wethAddress) {
                    totalWETH += _amounts[i];
                } else {
                    uint256 wethAmount = _swapTokensForTokens(
                        _tokenDetails.tokens[i],
                        wethAddress,
                        routerAddress,
                        _amounts[i],
                        address(this),
                        _buffer,
                        _deadline
                    );
                    totalWETH += wethAmount;
                }
            }
            unchecked {
                ++i;
            }
        }

        if (totalWETH > 0) {
            IWETH(wethAddress).withdraw(totalWETH);
            (bool success, ) = _receiver.call{value: totalWETH}("");
            require(
                success,
                "Failed to unwrap and transfer WETH to the receiver"
            );
            totalETH = totalWETH;
        }

        return totalETH;
    }

    function withdrawETH(uint256 _liquidity,uint256 _buffer, uint256 _deadline) external nonReentrant validateMinLpWithdrawal(_liquidity) {
       
        if (_buffer == 0 || _buffer >= 5000) {
            revert InvalidBuffer(_buffer, 1, 4999);
        }

        IFactory factoryInstance = _factory(); 
        (, , uint256 withdrawalFee, address feeCollector) = factoryInstance
            .getPlatformFeeConfig();

        uint256 feeLiquidity = 0;
        uint256 userLiquidity = _liquidity;
        uint256 feeWethAmount = 0;

        if (withdrawalFee > 0) {
            feeLiquidity = (_liquidity * withdrawalFee) / PERCENT_PRECISION;
            userLiquidity = _liquidity - feeLiquidity;

            uint256[] memory feeAmounts = _withdraw(
                feeLiquidity,
                address(this)
            );

            feeWethAmount = _tokensToEth(
                factoryInstance,
                feeAmounts,
                payable(feeCollector),
                _buffer,
                _deadline
            );
            emit PlatformFeeDeducted(
                feeWethAmount,
                withdrawalFee,
                feeCollector,
                "withdrawETH"
            );
        }

        uint256[] memory userAmounts = _withdraw(userLiquidity, address(this));

        uint256 ethAmount = _tokensToEth(
            factoryInstance,
            userAmounts,
            payable(msg.sender),
            _buffer,
            _deadline
        );

        emit WithdrawnETHFromBSKT(address(this), msg.sender, ethAmount);
    }

    function rebalance(
        address[] calldata _newTokens,
        uint256[] calldata _newWeights,
        uint256 _buffer,
        uint256 _deadline
    ) external onlyOwner {
        if (_buffer == 0 || _buffer >= 5000) {
            revert InvalidBuffer(_buffer, 1, 4999);
        }
        _rebalance(_newTokens, _newWeights, _buffer, false, _deadline);
    }

    function emergencyStable(
        address[] calldata _newTokens,
        uint256[] calldata _newWeights,
        uint256 _buffer,
        uint256 _deadline
    ) external onlyOwner {
        if (_buffer == 0 || _buffer >= 5000) {
            revert InvalidBuffer(_buffer, 1, 4999);
        }
        _rebalance(_newTokens, _newWeights, _buffer, true, _deadline);
    }

    function claimFee(
        uint256 amount,
        uint256 _buffer,
        uint256 _deadline
    ) external onlyOwner {
        if (_buffer == 0 || _buffer >= 5000) {
            revert InvalidBuffer(_buffer, 1, 4999);
        }

        IFactory factoryInstance = _factory();

        IBSKTPair(bsktPair).distMgmtFee();
        IERC20Upgradeable(bsktPair).transfer(bsktPair, amount);
        uint256[] memory _amounts = IBSKTPair(bsktPair).burn(address(this));

        uint256 ethBought = _tokensToEth(
            factoryInstance,
            _amounts,
            payable(getOwner()),
            _buffer,
            _deadline
        );

        emit FeeClaimed(address(this), getOwner(), amount, ethBought);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public
        override(ERC721Upgradeable, IERC721Upgradeable)
        onlyWhitelistedContract(to)
    {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public
        override(ERC721Upgradeable, IERC721Upgradeable)
        onlyWhitelistedContract(to)
    {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public
         override(ERC721Upgradeable, IERC721Upgradeable)
        onlyWhitelistedContract(to){
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function approve(address to, uint256 tokenId)
        public
        override(ERC721Upgradeable, IERC721Upgradeable)
        onlyWhitelistedContract(to)
    {
        super.approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        override(ERC721Upgradeable, IERC721Upgradeable)        
    {
        if(approved) {
            if (isContractAddress(operator) && !_factory().isWhitelistedContract(operator)) {
                revert ContractNotWhitelisted();
            }
        }
        
        super.setApprovalForAll(operator, approved);
    }

    function _checkValidTokensAndWeights(
        address[] memory _tokens,
        uint256[] memory _weights
    ) private view {
        uint256 _totalWeight;
        bool isAlvaPresent = false;
        address alvaAddress = _factory().alva();

        for (uint256 i = 0; i < _tokens.length; ) {
            if (!isContractAddress(_tokens[i]))
                revert InvalidContractAddress(_tokens[i]);

            if (
                !_checkForDuplicateAddress(_tokens, _tokens[i], i + 1) &&
                _weights[i] != 0
            ) {
                if (_tokens[i] == alvaAddress) {
                    isAlvaPresent = true;
                    uint256 minPercentALVA = _factory().minPercentALVA();
                    if (_weights[i] < minPercentALVA) {
                        revert InsufficientAlvaPercentage(
                            _weights[i],
                            minPercentALVA
                        );
                    }
                }

                _totalWeight += _weights[i];
            } else {
                if (_weights[i] == 0) {
                    revert ZeroTokenWeight();
                } else {
                    revert InvalidToken();
                }
            }

            unchecked {
                ++i;
            }
        }

        if (!isAlvaPresent) revert NoAlvaTokenIncluded();
        if (_totalWeight != PERCENT_PRECISION) revert InvalidWeight();
    }

    function _withdraw(uint256 _liquidity, address _to)
        private
        returns (uint256[] memory amounts)
    {
        if (_liquidity == 0) revert InvalidWithdrawalAmount();

        IERC20Upgradeable(bsktPair).transferFrom(
            msg.sender,
            bsktPair,
            _liquidity
        );
        amounts = IBSKTPair(bsktPair).burn(_to);
    }

    function _rebalance(
        address[] memory _newTokens,
        uint256[] memory _newWeights,
        uint256 _buffer,
        bool _isEmergencyStable,
        uint256 _deadline
    ) private checkLength(_newTokens.length, _newWeights.length) {
        if (_isEmergencyStable && _newTokens.length != 2) {
            revert InvalidEmergencyParams();
        }
        if (_deadline <= block.timestamp) revert DeadlineInPast(_deadline);

        _checkValidTokensAndWeights(_newTokens, _newWeights);

        IBSKTPair(bsktPair).setReentrancyGuardStatus(true);
        IBSKTPair(bsktPair).transferTokensToOwner();

        address wethAddress = _factory().weth();
        address routerAddress = _factory().router();

        uint256 wethBought = _prepareRebalance(wethAddress, routerAddress, _buffer, _deadline);
        _allocateNewWeights(wethBought, _newTokens, _newWeights, wethAddress, routerAddress, _buffer, _deadline);
        _finalizeRebalance(_newTokens, _newWeights);
    }

    function _prepareRebalance(
        address wethAddress,
        address routerAddress,
        uint256 _buffer,
        uint256 _deadline
    ) private returns (uint256 wethBought) {
        uint256 tokensLength = _tokenDetails.tokens.length;

        for (uint256 i = 0; i < tokensLength; ) {
            address token = _tokenDetails.tokens[i];
            uint256 balance = IERC20Upgradeable(token).balanceOf(address(this));

            if (balance > 0) {
                wethBought += _swapTokensForTokens(
                    token,
                    wethAddress,
                    routerAddress,
                    balance,
                    address(this),
                    _buffer,
                    _deadline
                );
            }

            unchecked {
                ++i;
            }
        }
    }

    function _allocateNewWeights(
        uint256 wethAmount,
        address[] memory _newTokens,
        uint256[] memory _newWeights,
        address wethAddress,
        address routerAddress,
        uint256 _buffer,
        uint256 _deadline
    ) private {
        uint256 tokensLength = _newWeights.length;
        uint256 totalAllocated;

        for (uint256 i = 0; i < tokensLength; ) {
            uint256 amountToSwap;

            if (i == tokensLength - 1) {
                amountToSwap = wethAmount - totalAllocated;
            } else {
                amountToSwap = (wethAmount * _newWeights[i]) / PERCENT_PRECISION;
                totalAllocated += amountToSwap;
            }

            _swapTokensForTokens(
                wethAddress,
                _newTokens[i],
                routerAddress,
                amountToSwap,
                bsktPair,
                _buffer,
                _deadline
            );

            unchecked {
                ++i;
            }
        }
    }

    function _finalizeRebalance(
        address[] memory _newTokens,
        uint256[] memory _newWeights
    ) private {
        emit BSKTRebalanced(
            address(this),
            _tokenDetails.tokens,
            _tokenDetails.weights,
            _newTokens,
            _newWeights
        );

        IBSKTPair(bsktPair).updateTokens(_newTokens);
        _tokenDetails.tokens = _newTokens;
        _tokenDetails.weights = _newWeights;

        IBSKTPair(bsktPair).setReentrancyGuardStatus(false);
    }





    function _swapTokensForTokens(
        address _tokenIn,
        address _tokenOut,
        address _router,
        uint256 _amountIn,
        address _to,
        uint256 _buffer,
        uint256 _deadline
    ) private returns (uint256) {
        IERC20Upgradeable(_tokenIn).safeApprove(_router, 0);
        IERC20Upgradeable(_tokenIn).safeApprove(_router, _amountIn);

        address[] memory path = _factory().getPath(_tokenIn, _tokenOut);
        if (path.length != 2) revert InvalidLength();

        uint256 _amountOutMin = (_factory().getAmountsOut(_amountIn, path) *
            (PERCENT_PRECISION - _buffer)) / PERCENT_PRECISION;

        uint256 balanceBefore = IERC20Upgradeable(_tokenOut).balanceOf(_to);
        IUniswapV2Router(_router)
            .swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _amountIn,
                _amountOutMin,
                path,
                _to,
                _deadline
            );
        uint256 balanceAfter = IERC20Upgradeable(_tokenOut).balanceOf(_to);

        return balanceAfter - balanceBefore;
    }

    function _registerInterface(bytes4 interfaceId) internal virtual {
        if (interfaceId == 0xffffffff) revert InvalidInterfaceId();
        _supportedInterfaces[interfaceId] = true;
    }

    function _checkForDuplicateAddress(
        address[] memory _array,
        address _address,
        uint256 _startIndex
    ) internal pure returns (bool) {
        if (_array.length > _startIndex) {
            for (uint256 i = _startIndex; i < _array.length; ) {
                if (_array[i] == _address) revert DuplicateToken();
                unchecked {
                    ++i;
                }
            }
        }
        return false;
    }

    function _factory() private view returns (IFactory) {
        return IFactory(factory);
    }

    function isContractAddress(address target) internal view returns (bool) {
        return AddressUpgradeable.isContract(target);
    }

    function totalTokens() external view returns (uint256 tokenLength) {
        tokenLength = _tokenDetails.tokens.length;
    }

    function getTokenValueByWETH() public view returns (uint256 value) {
        IFactory factoryInstance = _factory(); 
        address wethAddress = factoryInstance.weth(); 
        uint256 tokensLength = _tokenDetails.tokens.length;
        
        for (uint256 i = 0; i < tokensLength; ) {
            address token = _tokenDetails.tokens[i]; 
            uint256 balance = IBSKTPair(bsktPair).getTokenReserve(i); 
            
            address[] memory path = factoryInstance.getPath(token, wethAddress); 
            
            value += factoryInstance.getAmountsOut(balance, path); 
            
            unchecked {
                ++i;
            }
        }
    }

    function contractURI() public view returns (string memory) {
        return _factory().getContractURI();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorageUpgradeable, IERC165Upgradeable, IBSKT)
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId) ||
            _supportedInterfaces[interfaceId];
    }

    function royaltyInfo(
        uint256,
        uint256 _salePrice
    )
        external
        view
        override(IBSKT, IERC2981Upgradeable)
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = _factory().royaltyReceiver();
        uint256 rate = _factory().royaltyPercentage();
        if (rate > 0 && receiver != address(0)) {
            royaltyAmount = (_salePrice * rate) / PERCENT_PRECISION;
        }
    }

    function getTokenDetails(uint256 _index)
        external
        view
        returns (address token, uint256 weight)
    {
        uint256 length = _tokenDetails.tokens.length;
        if (_index >= length) revert TokenIndexOutOfBounds(_index, length);
        token = _tokenDetails.tokens[_index];
        weight = _tokenDetails.weights[_index];
    }

    function getTokenDetails()
        external
        view
        returns (address[] memory tokens, uint256[] memory weights)
    {
        return (_tokenDetails.tokens, _tokenDetails.weights);
    }

    function getOwner() public view returns (address owner) {
        return ownerOf(0);
    }

    modifier validateMinLpWithdrawal(uint256 amount) {
        uint256 min = _factory().minLpWithdrawal();
        if (amount < min) revert InvalidWithdrawalAmount();
        _;
    }

    modifier checkLength(uint256 lengthOne, uint256 lengthTwo) {
        if (lengthOne != lengthTwo || lengthOne == 0 || lengthTwo == 0)
            revert InvalidLength();
        _;
    }

    modifier onlyOwner() {
        if (getOwner() != msg.sender) revert InvalidOwner();
        _;
    }

    modifier onlyWhitelistedContract(address target) {
        if (isContractAddress(target)) {
            if (!_factory().isWhitelistedContract(target))
                revert ContractNotWhitelisted();
        }
        _;
    }

    event ContributedToBSKT(address bskt, address indexed sender, uint256 amount);

    event WithdrawnFromBSKT(
        address bskt,
        address indexed sender,
        address[] tokens,
        uint256[] amounts
    );

    event WithdrawnETHFromBSKT(
        address bskt,
        address indexed sender,
        uint256 amount
    );

    event BSKTRebalanced(
        address indexed bskt,
        address[] oldtokens,
        uint256[] oldWeights,
        address[] newTokens,
        uint256[] newWeights
    );

    event PlatformFeeDeducted(
        uint256 feeAmount,
        uint256 feePercent,
        address indexed feeCollector,
        string action
    );

    event FeeClaimed(
        address indexed bskt,
        address indexed manager,
        uint256 lpAmount,
        uint256 ethAmount
    );

    error InvalidLength();

    error InvalidToken();

    error InvalidWeight();

    error InvalidOwner();

    error InvalidBuffer(
        uint256 provided,
        uint256 minRequired,
        uint256 maxAllowed
    );

    error ContractNotWhitelisted();

    error ZeroContributionAmount();

    error InvalidEmergencyParams();

    error NoAlvaTokenIncluded();

    error InsufficientAlvaPercentage(uint256 provided, uint256 required);

    error DuplicateToken();

    error ZeroTokenWeight();

    error InvalidInterfaceId();

    error InvalidWithdrawalAmount();

    error DeadlineInPast(uint256 deadline);

    error InvalidContractAddress(address target);

    error TokenIndexOutOfBounds(uint256 index, uint256 length);

    error UnauthorizedSender(address sender);
}
