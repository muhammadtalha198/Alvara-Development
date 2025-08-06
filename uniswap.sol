// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


interface IWETH {
    function deposit() external payable;

    function withdraw() external;

    function mint(address to, uint256 amount) external;

    function burn(address from, uint256 amount) external;

    function transfer(address to, uint256 amount) external returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

// ["0xC588fFb141b4cFc405BD87BB4793C49eAA4E9Bf5","0xB37B2D41E46cDc47b4d33EebBf027c9405453f64"]
// 1000000000000000,1000000000000000000

// AERo: 0xCf19DeBf8359fd17bd36AdBd71869CA9E8E4FacC
// AIOZ: 0x565BD1C5C443BC2F1C2aE6Fe06Ed0ee1ef08141D
//  AKT: 0x9DD41ECd6e1701CE34523ed98423c1eFb0805aBD

// AAVE: 0x9Dfc8C3143E01cA01A90c3E313bA31bFfD9C1BA9
// ALVA: 0x51A0dfea63768e7827e9AAA532314910648F3eD2

// ["0x51A0dfea63768e7827e9AAA532314910648F3eD2","0x9Dfc8C3143E01cA01A90c3E313bA31bFfD9C1BA9"]
// ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"]
// ["1000000000000","1000000000000"]

// ["0x78194Fd31F03cDfC782BBC8Ada4471c56702F306","0x9c30D4B8790467515A9dAE8C2369f2Bd6e4b8f39","0x7b5c8eB52d19C965e88D0580Ea7F5a5a95516Dde","0x9053Ce7DD774d13c44330cBB9935b4277CE0aDc0"]
// ["0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915","0xcCc22A7fc54d184138dfD87B7aD24552cD4E0915"]
// ["1000000000000","1000000000000","1000000000000","1000000000000"]


// ["0x9279F54dAc3570d115AdB6083f85D05a4e6F41Ad","0x565BD1C5C443BC2F1C2aE6Fe06Ed0ee1ef08141D"]

// spolia 

contract UniswapV2Router02 is AccessControlUpgradeable {
    
    struct TokenDetail {
        uint256 price;
        address tokenManager;
    }

    address public immutable WETH;

    mapping(address => TokenDetail) public tokenDetails;

    bytes32 public constant PRICE_MANAGER = keccak256("PRICE_MANAGER");

    constructor(address _WETH) {
        WETH = _WETH;
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(PRICE_MANAGER, _msgSender());
        tokenDetails[_WETH] = TokenDetail(1e18, _msgSender());
    }

    function setTokenDetails(
        address tokenAddress,
        address tokenManager,
        uint256 price
    ) public onlyRole(PRICE_MANAGER) {
        tokenDetails[tokenAddress] = TokenDetail(price, tokenManager);
    }

    function setTokensDetails(
        address[] memory tokenAddresses,
        address[] memory tokenManagers,
        uint256[] memory prices
    ) public onlyRole(PRICE_MANAGER) {
        require(
            tokenAddresses.length <= 30,
            "UniswapV2Router: Tokens array is too long, reduce the number of tokens"
        );

        for (uint256 i; i < tokenAddresses.length; i++) {
            tokenDetails[tokenAddresses[i]] = TokenDetail(
                prices[i],
                tokenManagers[i]
            );
        }
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) public payable {
        
        require(path[0] == WETH, "UniswapV2Router: INVALID_PATH");
        require(deadline >= block.timestamp, "UniswapV2Router: EXPIRED");

        uint amountIn = msg.value;

        uint amountOut = getAmountsOut(amountIn, path)[1];
        require(
            amountOut > 0 && amountOut >= amountOutMin,
            "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
        );

        address manager = tokenDetails[path[1]].tokenManager;
        uint256 allowance = IWETH(path[1]).allowance(manager, address(this));
        require(
            allowance >= amountOut,
            "UniswapV2Router: INSUFFICIENT_AMOUNT_ALLOWED"
        );

        IWETH(WETH).deposit{value: amountIn}();
        IWETH(WETH).transfer(path[1], amountIn);
        IWETH(path[1]).transferFrom(manager, to, amountOut);
    }

    

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        returns (uint[] memory amounts)
    {
        require(
            amountIn > 0,
            "UniswapV2Router: amountIn should be greater than zero"
        );
        require(
            path.length >= 2,
            "UniswapV2Router: path contains at least 2 elements"
        );

        amounts = new uint[](path.length);
        amounts[0] = amountIn;

        for (uint i; i < path.length - 1; i++) {
            if (tokenDetails[path[i + 1]].price != 0) {
                if (path[0] == WETH) {
                    amounts[i + 1] =
                        (amountIn * 1e18) /
                        tokenDetails[path[i + 1]].price;
                } else {
                    uint amountInEth = (amountIn *
                        1e18 *
                        tokenDetails[path[0]].price) / 1e18;
                    amounts[i + 1] =
                        amountInEth /
                        tokenDetails[path[i + 1]].price;
                }
            } else {
                amounts[i + 1] = 0;
            }
        }

        return amounts;
    }

    function getWETHAddress() public view returns (address) {
        return WETH;
    }

    function getTokenPrice(address tokenAddress) public view returns (uint256) {
        return tokenDetails[tokenAddress].price;
    }

    function getTokenDetails(address tokenAddress)
        public
        view
        returns (TokenDetail memory)
    {
        return tokenDetails[tokenAddress];
    }

    // function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    //     uint256 amountIn,
    //     uint256 amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint256 deadline
    // ) public {
    //     require(deadline >= block.timestamp, "UniswapV2Router: EXPIRED");

    //     uint amountOut = getAmountsOut(amountIn, path)[1];
    //     require(
    //         amountOut > 0 && amountOut >= amountOutMin,
    //         "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
    //     );

    //     address managerOut = tokenDetails[path[1]].tokenManager;

    //     uint256 allowanceTokenIn = IWETH(path[0]).allowance(
    //         _msgSender(),
    //         address(this)
    //     );

    //     require(
    //         allowanceTokenIn >= amountIn,
    //         "UniswapV2Router: INSUFFICIENT_AMOUNT_ALLOWED_TOKEN_IN"
    //     );

    //     uint256 allowanceTokenOut = IWETH(path[1]).allowance(
    //         managerOut,
    //         address(this)
    //     );

    //     require(
    //         allowanceTokenOut >= amountOut,
    //         "UniswapV2Router: INSUFFICIENT_AMOUNT_ALLOWED_TOKEN_OUT"
    //     );

    //     IWETH(path[0]).transferFrom(_msgSender(), address(this), amountIn);
    //     IWETH(path[0]).transfer(managerOut, amountIn);

    //     IWETH(path[1]).transferFrom(managerOut, to, amountOut);
    // }
}