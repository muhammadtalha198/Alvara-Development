
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {UD60x18, powu, unwrap} from "@prb/math/src/UD60x18.sol";
import "./interfaces/IFactory.sol";
import "./interfaces/IBSKT.sol";
import "./interfaces/IBSKTPair.sol";
import "./interfaces/IUniswap.sol";
import "./interfaces/IERC20.sol";

import "hardhat/console.sol";

contract Factory is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, IFactory {
    
    struct PlatformFeeConfig { 

        uint16 bsktCreationFee; 
        uint16 contributionFee; 
        uint16 withdrawalFee; 
        address feeCollector; 
    }
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant URI_MANAGER_ROLE = keccak256("URI_MANAGER_ROLE");
    bytes32 public constant WHITELIST_MANAGER_ROLE = keccak256("WHITELIST_MANAGER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    uint256 public constant PERCENT_PRECISION = 10000;
    uint16 public constant DEFAULT_FEE = 50;
    
    uint256 private _minLpWithdrawal;
    address public alva;
    address public router;
    address public weth;
    address public bsktImplementation;
    address public bsktPairImplementation;
    address public royaltyReceiver;
    uint256 public royaltyPercentage;
    uint16 public minPercentALVA;
    uint256 public minBSKTCreationAmount;
    uint256 public monthlyFeeRate;
    string public collectionUri;

//     struct BTSFactoryInitParams {
//     address _alva;
//     address _bsktImplementation;
//     address _bsktPairImplementation;
//     address _routerAddress;
//     address _wethAddress;
//     address _royaltyReceiver;
//     address _feeCollector;
//     address _defaultMarketplace;
//     uint256 _minPercentALVA;
//     uint256 _monthlyFeeRate;
//     string _collectionUri;
//     uint256 _minBSKTCreationAmount;
// }

// ["0xAb2758cC7Ef786DbCEc38D2f156230b5993E2e71","0x3128Ef4221F151D0F9D9E04aD70CF5Af052a6F37","0x9342Dc51Aea8015ca497E7abF39030Ef28136471","0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3","0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915",100,10,"_collectionUri",10]

// Remix 
// ["0xeF50110EAc01512796e7AaFEe68458800A4bD358","0x62FF318Bee4D6d605D163Ed3325077E32803599B","0xDf159010A8d1B173262EBb3D7b5393Dc0333301d","0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3","0xD31f44e3C93cB349BD3aFAD9725Bca50C410b27c","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915",100,10,"_collectionUri",10]

// Monad 0xE53C8912c40066c47258f54d42B8Ec9253086F8e
// ["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0","0xeF2B7db5Dfba8Cab0BAefD289Eb4F35d6D1dFDe8","0xC27c2a1ce48493D9d82E66F93323Ef803000C22a","0xfB8e1C3b833f9E67a71C859a132cf783b645e436","0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0",100,10,"_collectionUri",10]

    address[] public bsktList;
    mapping(address => bool) public whitelistedContracts;
    
    PlatformFeeConfig private platformFeeConfig;

    constructor() { 
        // _disableInitializers();
    }

    function initialize(BTSFactoryInitParams calldata params) external initializer {
        
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        __ReentrancyGuard_init();

        _validateInitParams(params);

        alva = params._alva;
        bsktImplementation = params._bsktImplementation;
        bsktPairImplementation = params._bsktPairImplementation;
        router = params._routerAddress;
        weth = params._wethAddress;
        royaltyReceiver = params._royaltyReceiver;
        minPercentALVA = params._minPercentALVA;
        monthlyFeeRate = params._monthlyFeeRate;
        collectionUri = params._collectionUri;
        minBSKTCreationAmount = params._minBSKTCreationAmount;

        platformFeeConfig = PlatformFeeConfig(DEFAULT_FEE, DEFAULT_FEE, DEFAULT_FEE, params._feeCollector);
        royaltyPercentage = 200;

        whitelistedContracts[params._defaultMarketplace] = true;

        _minLpWithdrawal = 1e11;
    }

    function _validateInitParams(BTSFactoryInitParams calldata params) private pure {
        if (
            params._alva == address(0) ||
            params._bsktImplementation == address(0) ||
            params._bsktPairImplementation == address(0) ||
            params._routerAddress == address(0) ||
            params._wethAddress == address(0) ||
            params._royaltyReceiver == address(0) ||
            params._feeCollector == address(0) ||
            params._defaultMarketplace == address(0)
        ) revert InvalidAddress();

        if (params._minPercentALVA < 100 || params._minPercentALVA > 5000) {
            revert InvalidAlvaPercentage(params._minPercentALVA, 100, 5000);
        }

        if (bytes(params._collectionUri).length == 0) {
            revert EmptyStringParameter("collectionUri");
        }
    }

    //  struct BSKTInput {
    //     string name;
    //     string symbol;
    //     address[] tokens;
    //     uint256[] weights;
    //     string tokenURI;
    //     uint256 slippage;
    //     string id;
    //     string description;
    //     uint256 deadline;
    // }

    // 100
    // 100


// ["LstBTC","LstBTC",["0xAb2758cC7Ef786DbCEc38D2f156230b5993E2e71","0x0fc4580f70C517B148a141f3721C5138f74401b1"],[3000,7000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
// ["LstBTC","LstBTC",["0xAb2758cC7Ef786DbCEc38D2f156230b5993E2e71"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]


// ["0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14","0xAb2758cC7Ef786DbCEc38D2f156230b5993E2e71"]
// ["0xAb2758cC7Ef786DbCEc38D2f156230b5993E2e71","0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"]

// ["0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14","0x0fc4580f70C517B148a141f3721C5138f74401b1"]


// MONAD
// ["LstBTC","LstBTC",["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
// ["LstBTC","LstBTC",["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]

    //Remix
//      ["LstBTC","LstBTC",["0xeF50110EAc01512796e7AaFEe68458800A4bD358"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]


    function createBSKT(BSKTInput calldata input) external payable nonReentrant {
        
        uint256 amountAfterFee = _validateAndChargeCreationFee(input);
        require(amountAfterFee < msg.value,"amountAfterFee is not less then msg.value");

        (address _bskt, address _bsktPair) = _initializeBSKTWithPair(input);
        require(_bskt != address(0) && _bsktPair != address(0), "bskt, _bsktPair address is zero");

        (uint256 totalETHswapped, uint256[] memory amounts) = _swapETHForTokens(_bsktPair, input, amountAfterFee);

        require( totalETHswapped > 0, "totalETHswapped is less then  0");
       
        bsktList.push(_bskt);
            
            require(bsktList.length > 0, "bsktList.length address is zero");
        
        // IBSKTPair(_bsktPair).mint(msg.sender, amounts);
        OwnableUpgradeable(_bsktPair).transferOwnership(_bskt);
        
        require( IBSKTPair(_bsktPair).getOwner() == _bskt, "owner didnt set");
        require(totalETHswapped <= amountAfterFee,"totalETHswapped > amountAfterFee");

        // if (totalETHswapped > amountAfterFee) {
        //     revert ExcessiveSwapAmount();
        // }

        if (totalETHswapped < amountAfterFee) {
            (bool success,) = payable(msg.sender).call{value: amountAfterFee - totalETHswapped}("");
            if (!success) revert TransferFailed();
        }

        emit BSKTCreated(
            // input.name,
            // input.symbol,
            _bskt,
            _bsktPair,
            msg.sender,
            amountAfterFee,
            input.slippage,
            input.id,
            input.description,
            amountAfterFee
        );
    }

    function _validateAndChargeCreationFee(BSKTInput calldata input) private returns (uint256 amountAfterFee) {
        
         
        if (msg.value < minBSKTCreationAmount) {
            revert InsufficientBSKTCreationAmount(msg.value, minBSKTCreationAmount);
        }
         
        if (input.slippage == 0 || input.slippage >= 5000) {
            revert InvalidBuffer(input.slippage, 1, 4999);
        }

         
        if (input.deadline <= block.timestamp) {
            revert DeadlineInPast(input.deadline);
        }

         
        if (bytes(input.name).length == 0) {
            revert EmptyStringParameter("name");
        }

         
        if (bytes(input.symbol).length == 0) {
            revert EmptyStringParameter("symbol");
        }

         
        if (bytes(input.tokenURI).length == 0) {
            revert EmptyStringParameter("tokenURI");
        }

         
        if (bytes(input.id).length == 0) {
            revert EmptyStringParameter("id");
        }

         
        if (input.tokens.length != input.weights.length || input.tokens.length == 0 || input.weights.length == 0) {
            revert InvalidTokensAndWeights();
        }

        uint256 creationFeeAmount = platformFeeConfig.bsktCreationFee > 0 ? (msg.value * platformFeeConfig.bsktCreationFee) / PERCENT_PRECISION: 0;
         
        if (creationFeeAmount > msg.value) {
            revert InvalidFee();
        }

         
        if (creationFeeAmount > 0) {
            (bool success,) = payable(platformFeeConfig.feeCollector).call{value: creationFeeAmount}("");
            
            require(success, "Failed to deduct BSKT Creation Fee");
            emit BSKTCreationFeeDeducted(creationFeeAmount,platformFeeConfig.bsktCreationFee,platformFeeConfig.feeCollector);
        }

         
        amountAfterFee = msg.value - creationFeeAmount;
    }


    function _initializeBSKTWithPair(BSKTInput calldata input) internal returns (address _bts, address _btsPair) {
        
        
        // Deploy BTS Pair
        BeaconProxy btsPair = new BeaconProxy(
            bsktPairImplementation,
            abi.encodeWithSelector(
                IBSKTPair.initialize.selector,
                address(this),
                input.symbol,
                input.tokens
            )
        );
        _btsPair = address(btsPair);

        
        // Deploy BTS Pair

        // Prepare BasketParams struct for IBTS.initialize()
        IBSKT.BasketParams memory params = IBSKT.BasketParams({
            name: input.name,
            symbol: input.symbol,
            owner: msg.sender,
            factoryAddress: address(this),
            tokens: input.tokens,
            weights: input.weights,
            bsktPair: _btsPair,
            tokenURI: input.tokenURI,
            id: input.id,
            description: input.description
        });

        // Deploy BTS contract with struct
        BeaconProxy bts = new BeaconProxy(
            bsktImplementation,
            abi.encodeWithSelector(
                IBSKT.initialize.selector,
                params
            )
        );
        _bts = address(bts);

    }

    function _swapETHForTokens(address _bsktPair, BSKTInput calldata input,uint256 amountAfterFee) internal returns (uint256 totalETHswapped, uint256[] memory amounts) {
       
        uint256 tokensLength = input.tokens.length;
        amounts = new uint256[](tokensLength);
        
        totalETHswapped = 0;

        for (uint256 i = 0; i < tokensLength;) {
            
            uint256 _amountInMin = (i == tokensLength - 1) ? amountAfterFee - totalETHswapped : (amountAfterFee * input.weights[i]) / PERCENT_PRECISION;

            console.log("_amountInMin: ",_amountInMin);

            address[] memory path = getPath(weth, input.tokens[i]);

             console.log("getAmountsOut: ",getAmountsOut(_amountInMin, path));
             console.log("PERCENT_PRECISION - input.slippage: ",PERCENT_PRECISION - input.slippage);
            
            uint256 _amountOutMin = (getAmountsOut(_amountInMin, path) * (PERCENT_PRECISION - input.slippage)) / PERCENT_PRECISION;
             console.log("_amountOutMin: ",_amountOutMin);

            uint256 balanceBefore = IERC20(input.tokens[i]).balanceOf(_bsktPair);

            IUniswapV2Router(router).swapExactETHForTokensSupportingFeeOnTransferTokens{value: _amountInMin}(
                _amountOutMin,
                path,
                _bsktPair,
                input.deadline
            );

            totalETHswapped += _amountInMin;
            amounts[i] = IERC20(input.tokens[i]).balanceOf(_bsktPair) - balanceBefore;

            unchecked { ++i; }
        }

        require(totalETHswapped > 0, "totalETHswapped is zero ");
        require(amounts.length > 0, "amounts length is  zero ");

        return (totalETHswapped, amounts);
    }

    

    function updateBSKTImplementation(address _bsktImplementation) external onlyRole(UPGRADER_ROLE) {
        if (_bsktImplementation == address(0) || !AddressUpgradeable.isContract(_bsktImplementation)) revert InvalidAddress();
        bsktImplementation = _bsktImplementation;
        emit BSKTImplementationUpdated(_bsktImplementation);
    }

    function updateBSKTPairImplementation(address _bsktPairImplementation) external onlyRole(UPGRADER_ROLE) {
        if (_bsktPairImplementation == address(0) || !AddressUpgradeable.isContract(_bsktPairImplementation)) revert InvalidAddress();
        bsktPairImplementation = _bsktPairImplementation;
        emit BSKTPairImplementationUpdated(_bsktPairImplementation);
    }

    function updateAlva(address _alva) external onlyRole(UPGRADER_ROLE) {
        if (_alva == address(0) || !AddressUpgradeable.isContract(_alva)) revert InvalidAddress();
        alva = _alva;
        emit AlvaUpdated(_alva);
    }

    function updateMinPercentALVA(uint16 _minPercentALVA) external onlyRole(ADMIN_ROLE) {
        if (_minPercentALVA < 100 || _minPercentALVA > 5000) revert InvalidAlvaPercentage(_minPercentALVA, 100, 5000);
        minPercentALVA = _minPercentALVA;
        emit MinAlvaPercentageUpdated(_minPercentALVA);
    }

    function updateCollectionURI(string calldata _collectionURI) external onlyRole(URI_MANAGER_ROLE) {
        if (bytes(_collectionURI).length == 0) revert EmptyStringParameter("URI");
        collectionUri = _collectionURI;
        emit CollectionURIUpdated(_collectionURI);
    }

    function updateRoyaltyPercentage(uint256 _royaltyPercentage) external onlyRole(FEE_MANAGER_ROLE) {
        if (_royaltyPercentage == 0 || _royaltyPercentage > 300) revert InvalidRoyaltyPercentage(_royaltyPercentage, 1, 300);
        if (_royaltyPercentage == royaltyPercentage) revert DuplicateRoyaltyValue();
        royaltyPercentage = _royaltyPercentage;
        emit RoyaltyUpdated(_royaltyPercentage);
    }

    function updateRoyaltyReceiver(address _royaltyReceiver) external onlyRole(FEE_MANAGER_ROLE) {
        if (_royaltyReceiver == address(0) || _royaltyReceiver == royaltyReceiver) revert InvalidAddress();
        royaltyReceiver = _royaltyReceiver;
        emit RoyaltyReceiverUpdated(_royaltyReceiver);
    }

    function updateMinBSKTCreationAmount(uint256 _minBSKTCreationAmount) external onlyRole(ADMIN_ROLE) {
        if (_minBSKTCreationAmount == 0 || _minBSKTCreationAmount == minBSKTCreationAmount) revert InvalidAmount();
        minBSKTCreationAmount = _minBSKTCreationAmount;
        emit MinBSKTCreationAmountUpdated(msg.sender, _minBSKTCreationAmount);
    }

    function addWhitelistedContract(address contractAddr) external onlyRole(WHITELIST_MANAGER_ROLE) {
        if (contractAddr == address(0) || whitelistedContracts[contractAddr] || !AddressUpgradeable.isContract(contractAddr)) revert InvalidWhitelistAddress(contractAddr, whitelistedContracts[contractAddr]);
        whitelistedContracts[contractAddr] = true;
        emit ContractWhitelisted(contractAddr);
    }

    function dewhitelistContract(address contractAddr) external onlyRole(WHITELIST_MANAGER_ROLE) {
        if (!whitelistedContracts[contractAddr]) revert InvalidWhitelistAddress(contractAddr, whitelistedContracts[contractAddr]);
        whitelistedContracts[contractAddr] = false;
        emit ContractRemovedFromWhitelist(contractAddr);
    }

    function setPlatformFeeConfig(uint16 _bsktCreationFee, uint16 _contributionFee, uint16 _withdrawalFee) external onlyRole(FEE_MANAGER_ROLE) {
        if (_bsktCreationFee > DEFAULT_FEE || _contributionFee > DEFAULT_FEE || _withdrawalFee > DEFAULT_FEE) revert InvalidFee();
        platformFeeConfig = PlatformFeeConfig(_bsktCreationFee, _contributionFee, _withdrawalFee, platformFeeConfig.feeCollector);
        emit PlatformFeesUpdated(_bsktCreationFee, _contributionFee, _withdrawalFee);
    }

    function setFeeCollector(address _feeCollector) external onlyRole(FEE_MANAGER_ROLE) {
        if (_feeCollector == address(0) || _feeCollector == platformFeeConfig.feeCollector) revert InvalidAddress();
        platformFeeConfig.feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }

    function totalBSKT() external view returns (uint256) { return bsktList.length; }

    function getBSKTAtIndex(uint256 index) external view returns (address) { require(index < bsktList.length, "Index out of bounds"); return bsktList[index]; }

    function calMgmtFee(uint256 months, uint256 lpSupply) external view returns (uint256) {
        uint256 oneMinusFeeRate = 1e18 - monthlyFeeRate;
        uint256 powerValue = unwrap(powu(UD60x18.wrap(oneMinusFeeRate), months));
        uint256 numerator = (1e18 - powerValue) * lpSupply;
        return numerator / powerValue;
    }

    function getContractURI() external view returns (string memory) { return collectionUri; }
    function minLpWithdrawal() external view returns (uint256) { return _minLpWithdrawal; }

    function setMinLpWithdrawal(uint256 newMin) external onlyRole(ADMIN_ROLE) { _minLpWithdrawal = newMin; emit MinLpWithdrawalUpdated(newMin); }

    function isWhitelistedContract(address contractAddr) external view returns (bool) { return whitelistedContracts[contractAddr]; }

    function getPlatformFeeConfig() external view returns (uint16, uint16, uint16, address) {
        return (platformFeeConfig.bsktCreationFee, platformFeeConfig.contributionFee, platformFeeConfig.withdrawalFee, platformFeeConfig.feeCollector);
    }


    function getAmountsOut(uint256 _amount, address[] memory _path) public view returns (uint256) {
        return IUniswapV2Router(router).getAmountsOut(_amount, _path)[_path.length - 1];
    }

    function getPath(address _tokenA, address _tokenB) public pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = _tokenA;
        path[1] = _tokenB;
        return path;
    }
    // ["0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14","0x0fc4580f70C517B148a141f3721C5138f74401b1"]


    event BSKTCreated( address bskt, address bsktPair, address indexed creator, uint256 amount, uint256 _buffer, string _id, string description, uint256 feeAmount);
    event AlvaUpdated(address alva);
    event MinAlvaPercentageUpdated(uint256 percent);
    event BSKTImplementationUpdated(address indexed bsktImplementation);
    event BSKTPairImplementationUpdated(address indexed bsktPairImplementation);
    event CollectionURIUpdated(string newURI);
    event RoyaltyUpdated(uint256 newRoyaltyPercentage);
    event RoyaltyReceiverUpdated(address indexed newRoyaltyReceiver);
    event PlatformFeesUpdated(uint16 bsktCreationFee, uint16 contributionFee, uint16 withdrawalFee);
    event FeeCollectorUpdated(address indexed newFeeCollector);
    event BSKTCreationFeeDeducted(uint256 feeAmount, uint256 feePercent, address indexed feeCollector);
    event MinBSKTCreationAmountUpdated(address indexed caller, uint256 amount);
    event ContractWhitelisted(address indexed contractAddress);
    event ContractRemovedFromWhitelist(address indexed contractAddress);
    event MinLpWithdrawalUpdated(uint256 newMinLpWithdrawal);
   
    error InvalidAddress();
    error InvalidAmount();
    error InvalidBuffer(uint256 provided, uint256 minAllowed, uint256 maxAllowed);
    error EmptyStringParameter(string paramName);
    error TransferFailed();
    error ExcessiveSwapAmount();
    error InvalidWhitelistAddress(address provided, bool alreadyWhitelisted);
    error InvalidRoyaltyPercentage(uint256 value, uint256 minAllowed, uint256 maxAllowed);
    error DuplicateRoyaltyValue();
    error InvalidAlvaPercentage(uint256 value, uint256 minAllowed, uint256 maxAllowed);
    error InsufficientBSKTCreationAmount(uint256 provided, uint256 minAllowed);
    error InvalidFee();
    error DeadlineInPast(uint256 deadline);
    error InvalidTokensAndWeights();
}