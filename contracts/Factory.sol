
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

// ["0xAb2758cC7Ef786DbCEc38D2f156230b5993E2e71","0x3128Ef4221F151D0F9D9E04aD70CF5Af052a6F37","0x9342Dc51Aea8015ca497E7abF39030Ef28136471","0x04e6Ee7B29634526e8abE5F5C37bcd136296b015","0xCE2a36BB4c6Db7B2fB0d60Bd1818c87E7fD2D129","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0",100,10,"_collectionUri",10]


// Alva :              0x51A0dfea63768e7827e9AAA532314910648F3eD2
// BSKTBeacon:         0x71e3404D69E70CA2a2f4E82d095BbdBA443336dC
// BSKTPairBeacon:     0x5C7078010eA1046720D08Daef080e1F75bB13682 
// UniswapV2Router02:  0x5D496b0Dad76628df71Ba7D3BAcdDB9fD2358DC1
// Weth :              0x7199069245A55f4092037BDDf22A18615e8FCa10

// Remix 
// ["0x51A0dfea63768e7827e9AAA532314910648F3eD2","0x71e3404D69E70CA2a2f4E82d095BbdBA443336dC","0x5C7078010eA1046720D08Daef080e1F75bB13682","0x5D496b0Dad76628df71Ba7D3BAcdDB9fD2358DC1","0x7199069245A55f4092037BDDf22A18615e8FCa10","0xdD870fA1b7C4700F2BD7f44238821C26f7392148","0xdD870fA1b7C4700F2BD7f44238821C26f7392148","0xdD870fA1b7C4700F2BD7f44238821C26f7392148",100,10,"_collectionUri",10]







// Monad 

// ["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0","0xeF2B7db5Dfba8Cab0BAefD289Eb4F35d6D1dFDe8","0xC27c2a1ce48493D9d82E66F93323Ef803000C22a","0x95F84Cd9A3D5fB01Db546c98d918a818D69bBFBf","0x6dD37D42B2427aA3c3e887B579E698a484D8e062","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0",100,10,"_collectionUri",10]
// ["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0","0xeF2B7db5Dfba8Cab0BAefD289Eb4F35d6D1dFDe8","0xC27c2a1ce48493D9d82E66F93323Ef803000C22a","0x95F84Cd9A3D5fB01Db546c98d918a818D69bBFBf","0x6dD37D42B2427aA3c3e887B579E698a484D8e062","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0","0xA33c5875BE1e3aFd5D72C5dF98D3469d95aC85B0",100,10,"_collectionUri",10]

    address[] public bsktList;
    mapping(address => bool) public whitelistedContracts;
    
    PlatformFeeConfig private platformFeeConfig;

    constructor() { 
        // _disableInitializers();
    }

    function initialize(BTSFactoryInitParams calldata params) external initializer {
        
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
        _grantRole(URI_MANAGER_ROLE, msg.sender);
        _grantRole(WHITELIST_MANAGER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        
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
// ["LstBTC","LstBTC",["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0","0x78194Fd31F03cDfC782BBC8Ada4471c56702F306"],[5000,5000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
// ["LstBTC","LstBTC",["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0","0x78194Fd31F03cDfC782BBC8Ada4471c56702F306","0x9c30D4B8790467515A9dAE8C2369f2Bd6e4b8f39"],[2000,3000,5000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
// ["LstBTC","LstBTC",["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0","0x78194Fd31F03cDfC782BBC8Ada4471c56702F306","0x9c30D4B8790467515A9dAE8C2369f2Bd6e4b8f39","0x7b5c8eB52d19C965e88D0580Ea7F5a5a95516Dde"],[1000,2000,3000,5000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]

// ["LstBTC","LstBTC",["0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
// ["LstBTC","LstBTC",["0x78194Fd31F03cDfC782BBC8Ada4471c56702F306"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",100,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
// ["LstBTC","LstBTC",["0x9c30D4B8790467515A9dAE8C2369f2Bd6e4b8f39"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",100,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
// ["LstBTC","LstBTC",["0x7b5c8eB52d19C965e88D0580Ea7F5a5a95516Dde"],[10000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",100,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]

   
   
   
    //Remix
//      ["LstBTC","LstBTC",["0x51A0dfea63768e7827e9AAA532314910648F3eD2","0x9Dfc8C3143E01cA01A90c3E313bA31bFfD9C1BA9"],[5000,5000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",50,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
//      ["LstBTC","LstBTC",["0x73DeAC4CE5Ae3caCe36F1481B62cb635D9733E0D","0x9DD41ECd6e1701CE34523ed98423c1eFb0805aBD","0x48526edd858a05f8591c0BA38c10f7493174ee1E"],[5000,3000,2000],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",100,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]
//      ["LstBTC","LstBTC",["0x73DeAC4CE5Ae3caCe36F1481B62cb635D9733E0D","0x9DD41ECd6e1701CE34523ed98423c1eFb0805aBD","0x48526edd858a05f8591c0BA38c10f7493174ee1E","0xCf19DeBf8359fd17bd36AdBd71869CA9E8E4FacC","0x565BD1C5C443BC2F1C2aE6Fe06Ed0ee1ef08141D"],[1000,4000,3000,1000,"1000"],"https://brown-near-muskox-833.mypinata.cloud/ipfs/QmTRHQsrCobn8g5DYZwmEVSJa4TPLh1c3LQdShc6FXHaN2",100,"68810ce25080883fb813b883","LstBTC LstBTC ",1756469477]

// AAVE: 0x48526edd858a05f8591c0BA38c10f7493174ee1E
//  AKT: 0x9DD41ECd6e1701CE34523ed98423c1eFb0805aBD
// AERo: 0xCf19DeBf8359fd17bd36AdBd71869CA9E8E4FacC
// AIOZ: 0x565BD1C5C443BC2F1C2aE6Fe06Ed0ee1ef08141D

// ALVA: 0x73DeAC4CE5Ae3caCe36F1481B62cb635D9733E0D

// ["0x9279F54dAc3570d115AdB6083f85D05a4e6F41Ad","0x73DeAC4CE5Ae3caCe36F1481B62cb635D9733E0D"]
// ["0x9279F54dAc3570d115AdB6083f85D05a4e6F41Ad","0x9DD41ECd6e1701CE34523ed98423c1eFb0805aBD"]
// ["0x9279F54dAc3570d115AdB6083f85D05a4e6F41Ad","0x48526edd858a05f8591c0BA38c10f7493174ee1E"]




    function createBSKT(BSKTInput calldata input) external payable nonReentrant {
        
        uint256 amountAfterFee = _validateAndChargeCreationFee(input);

        (address _bskt, address _bsktPair) = _initializeBSKTWithPair(input);

        (uint256 totalETHswapped, uint256[] memory amounts) = _swapETHForTokens(_bsktPair, input, amountAfterFee);
       
        bsktList.push(_bskt);
        
        IBSKTPair(_bsktPair).mint(msg.sender, amounts);
        OwnableUpgradeable(_bsktPair).transferOwnership(_bskt);

        if (totalETHswapped > amountAfterFee) {
            revert ExcessiveSwapAmount();
        }

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

            address[] memory path = getPath(weth, input.tokens[i]);
            
            uint256 _amountOutMin = (getAmountsOut(_amountInMin, path) * (PERCENT_PRECISION - input.slippage)) / PERCENT_PRECISION;

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
        if (_minPercentALVA < 100 || _minPercentALVA > 5000) 
            revert InvalidAlvaPercentage(_minPercentALVA, 100, 5000);
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
        if (_royaltyReceiver == address(0) || _royaltyReceiver == royaltyReceiver)
             revert InvalidAddress();
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

    function checkAllRoles(address account) external view returns (bool , bool, bool, bool, bool,bool) {
    return (
        hasRole(DEFAULT_ADMIN_ROLE, account),
        hasRole(ADMIN_ROLE, account),
        hasRole(FEE_MANAGER_ROLE, account),
        hasRole(URI_MANAGER_ROLE, account),
        hasRole(WHITELIST_MANAGER_ROLE, account),
        hasRole(UPGRADER_ROLE, account)
    );
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