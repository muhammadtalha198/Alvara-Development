// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IBSKT {

       struct BasketParams {
        string name;
        string symbol;
        address owner;
        address factoryAddress;
        address[] tokens;
        uint256[] weights;
        address bsktPair;
        string tokenURI;
        string id;
        string description;
    }

    function initialize(BasketParams calldata params)external;

    function contribute(uint256 __slippage, uint256 _deadline) external payable;
    function withdrawETH(uint256 _liquidity, uint256 __slippage, uint256 _deadline) external;
    function rebalance(address[] calldata _newTokens, uint256[] calldata _newWeights, uint256 __slippage, uint256 _deadline) external;
    function emergencyStable(address[] calldata _newTokens, uint256[] calldata _newWeights, uint256 __slippage, uint256 _deadline) external;
    function claimFee(uint256 amount, uint256 __slippage, uint256 _deadline) external;
    function getTokenDetails(uint256 _index) external view returns (address token, uint256 weight);
    function getTokenDetails() external view returns (address[] memory tokens, uint256[] memory weights);
    function totalTokens() external view returns (uint256 tokenLength);
    function getTokenValueByWETH() external view returns (uint256 value);
    function contractURI() external view returns (string memory);
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
    function royaltyInfo(uint256, uint256) external view returns (address receiver, uint256 royaltyAmount);
    function getOwner() external view returns (address owner);
}