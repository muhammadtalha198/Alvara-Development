# Basket Token Standard (BSKT) Smart Contract

This document provides an overview of the Basket Token Standard (BSKT) smart contract, explaining its functionalities, key events, and important functions.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Contract Variables](#contract-variables)
- [Modifiers](#modifiers)
- [Events](#events)
- [Custom Errors](#custom-errors)
- [Functions](#functions)
  - [Initialization](#initialization)
  - [Contributions and Withdrawals](#contributions-and-withdrawals)
  - [Rebalancing](#rebalancing)
  - [Utility Functions](#utility-functions)
  - [Update Functions](#update-functions)
  - [Royalty and Interface Functions](#royalty-and-interface-functions)
  - [Whitelist Enforcement](#whitelist-enforcement)
- [Security Considerations](#security-considerations)
- [Contribution](#contribution)

## Overview
The Basket Token Standard (BSKT) contract is designed to manage a basket of tokens with specified weights, allowing users to contribute to or withdraw from the basket while maintaining a balance of the tokens according to predefined rules. It integrates with the BSKT pair contract to manage the liquidity and focuses on maintaining the specified token weights. The contract implements ERC721 for basket tokens and ERC2981 for royalties support.

## Architecture
BSKT is part of the Alvara Protocol's Beacon Proxy architecture:

1. **BeaconProxy Pattern**: Each BSKT instance is a BeaconProxy, with the implementation controlled by a central UpgradeableBeacon. This allows all BSKT instances to be upgraded simultaneously by updating the implementation address in the beacon.

2. **Factory Relationship**: BSKT instances are created by the Factory contract, which also manages the BSKTPair contracts.
   - The Factory stores references to both the BSKT and BSKTPair instances it creates.
   - BSKT instances know their associated BSKTPair and the Factory that created them.

3. **Upgradeability**: The contract uses OpenZeppelin's upgradeable contracts pattern, allowing for future upgrades without losing state. This is implemented through the use of initializer functions instead of constructors.

4. **Token Basket Representation**: Each basket is represented as a single ERC721 NFT (token ID 0) owned by the creator, while the basket composition is managed via arrays of token addresses and weights.

5. **Liquidity Management**: The BSKT contract works closely with its paired BSKTPair contract to manage liquidity and token reserves. The BSKTPair handles the actual token storage and LP token minting/burning.

6. **Access Control**: The contract implements role-based access control through NFT ownership (token ID 0) and factory authorization for critical operations.

This architecture allows upgrading the BSKT logic without affecting the state of deployed BSKT instances.

## Contract Variables
- `bsktPair`: Address of the associated BSKT pair contract.
- `factory`: Address of the factory contract.
- `description`: Description of the BSKT.
- `_tokenDetails`: Struct containing arrays of token addresses and their respective weights.
- `id`: A string identifier for the BSKT.
- `_supportedInterfaces`: Mapping to track registered interfaces (e.g., ERC2981).

## Modifiers
- `validateMinLpWithdrawal(uint256 amount)`: Ensures LP withdrawal meets the minimum required by the factory. Reverts with `InvalidWithdrawalAmount` if the amount is less than the minimum.

- `checkLength(uint256 lengthOne, uint256 lengthTwo)`: Validates that two arrays have the same length and are not empty. Reverts with `InvalidLength` if the lengths don't match or are zero.

- `onlyOwner()`: Restricts function execution to the owner of the contract (owner of NFT with ID 0). Reverts with `InvalidOwner` if the caller is not the owner.

- `onlyWhitelistedContract(address target)`: Restricts token transfers and approvals to only whitelisted contracts or EOAs. Reverts with `ContractNotWhitelisted` if the target is a contract that's not whitelisted.

## Events
- `ContributedToBSKT(address bskt, address indexed sender, uint256 amount)`: Emitted when a user contributes ETH to the BSKT.
- `WithdrawnFromBSKT(address bskt, address indexed sender, address[] tokens, uint256[] amounts)`: Emitted when a user withdraws tokens from the BSKT.
- `WithdrawnETHFromBSKT(address bskt, address indexed sender, uint256 amount)`: Emitted when a user withdraws ETH from the BSKT.
- `RebalancedBSKT(address bskt, address[] oldtokens, uint256[] oldWeights, address[] newTokens, uint256[] newWeights)`: Emitted when the BSKT is rebalanced with new tokens or weights.
- `PlatformFeeDeducted(uint256 feeAmount, uint256 feePercent, address indexed feeCollector, string action)`: Emitted when a platform fee is deducted during operations like contribute, withdraw, or withdrawETH.
- `FeeClaimed(address indexed bskt, address indexed manager, uint256 lpAmount, uint256 ethAmount)`: Emitted when the manager claims a management fee.

## Custom Errors
- `InvalidLength()`: Thrown when array lengths do not match or are zero.
- `InvalidToken()`: Thrown when an invalid token is provided.
- `InvalidWeight()`: Thrown when token weights are invalid or don't sum to 100%.
- `InvalidOwner()`: Thrown when a non-owner tries to perform an owner-only action.
- `InvalidBuffer(uint256 provided, uint256 minRequired, uint256 maxAllowed)`: Thrown when buffer value is outside the valid range (1-4999).
- `ContractNotWhitelisted()`: Thrown when a non-whitelisted contract tries to interact with the BSKT.
- `ZeroContributionAmount()`: Thrown when a zero value is sent for a contribution.
- `InvalidEmergencyParams()`: Thrown when emergency stable operation has invalid parameters.
- `NoAlvaTokenIncluded()`: Thrown when no ALVA token is included in the basket.
- `InsufficientAlvaPercentage(uint256 provided, uint256 required)`: Thrown when ALVA token percentage is below the required minimum.
- `DuplicateToken()`: Thrown when a duplicate token is detected in the basket.
- `ZeroTokenWeight()`: Thrown when a token weight is zero.
- `InvalidInterfaceId()`: Thrown when an interface ID is invalid.
- `InvalidWithdrawalAmount()`: Thrown when a withdrawal amount is zero or below the minimum.
- `DeadlineInPast(uint256 deadline)`: Thrown when the transaction deadline has already passed.
- `InvalidContractAddress(address target)`: Thrown when the targeted address is not a valid contract address.
- `TokenIndexOutOfBounds(uint256 index, uint256 length)`: Thrown when trying to access a token at an index beyond the array bounds.
- `UnauthorizedSender(address sender)`: Thrown when an unauthorized address tries to send tokens to the contract.

## Functions

### Initialization

```solidity
    function initialize(
        string calldata _name,
        string calldata _symbol,
        address _owner,
        address _factoryAddress,
        address[] calldata _tokens,
        uint256[] calldata _weights,
        address _bsktPair,
        string calldata _tokenURI,
        string calldata _id,
        string calldata _description
) external initializer
```

Initializes the BSKT contract with the provided parameters. This function is called by the Factory when creating a new BSKT.

### Contributions and Withdrawals

```solidity
function contribute(uint256 _buffer, uint256 _deadline) external payable nonReentrant
```

Allows users to contribute ETH to mint BSKT tokens based on the current token weights. The `_buffer` parameter controls the maximum price buffer allowed (1-4999), and `_deadline` ensures the transaction is processed before a specific timestamp. A platform fee is deducted from the contribution amount before conversion to tokens.

```solidity
function withdraw(uint256 _liquidity, uint256 _buffer, uint256 _deadline) private nonReentrant validateMinLpWithdrawal(_liquidity)
```

Private function that handles the withdrawal of tokens from the basket. Burns LP tokens and sends the underlying tokens to the user after deducting withdrawal fees. The `_buffer` parameter protects against price slippage during token swaps, and `_deadline` ensures the transaction is processed before a specific timestamp. This function is used internally by other withdrawal methods but is not directly accessible to users.

```solidity
function withdrawETH(uint256 _liquidity, uint256 _buffer, uint256 _deadline) external nonReentrant validateMinLpWithdrawal(_liquidity)
```

Allows users to withdraw their tokens as ETH. Burns LP tokens, receives the underlying tokens, swaps them to WETH, converts WETH to ETH, and sends the ETH to the user. A withdrawal fee is deducted and sent to the fee collector. The `_buffer` parameter protects against price slippage, and `_deadline` ensures the transaction is processed before a specific timestamp. This is the recommended method for users to withdraw from the basket.

### Rebalancing

```solidity
function rebalance(address[] calldata _newTokens, uint256[] calldata _newWeights, uint256 _buffer, uint256 _deadline) external onlyOwner
```

Rebalances the token weights in the BSKTPair according to new weights defined by the owner. The function sells all existing tokens for WETH and then uses the WETH to buy the new tokens according to the specified weights. The `_buffer` parameter (1-4999) protects against price slippage during token swaps, and `_deadline` ensures the transaction is processed before a specific timestamp.

### Utility Functions

```solidity
function getTokenDetails(uint256 _index) external view returns (address token, uint256 weight)
```

Gets the details (address and weight) of a token at the specified index. Returns the token address and its weight in the basket.

```solidity
function totalTokens() external view returns (uint256 tokenLength)
```

Returns the number of tokens in the BSKT by returning the length of the tokens array.

```solidity
function getTokenValueByWETH() public view returns (uint256 value)
```

Calculates the total value of all tokens in the basket in terms of WETH by converting each token's value to its WETH equivalent using the router.

### Update Functions

```solidity
function rebalance(address[] calldata _newTokens, uint256[] calldata _newWeights, uint256 _buffer, uint256 _deadline) external onlyOwner
```

Updates the tokens and their weights in the BSKT and the BSKTPair. This function is called by the owner to modify the basket composition. The `_buffer` parameter (1-4999) protects against price slippage during any token swaps that might be needed.

```solidity
function emergencyStable(address[] calldata _newTokens, uint256[] calldata _newWeights, uint256 _buffer, uint256 _deadline) external onlyOwner
```

Emergency function that rebalances the basket to exactly 2 tokens in crisis situations. The function requires exactly 2 tokens with weights that sum to 100%. This ensures a more stable configuration while still maintaining some token variety. The `_buffer` parameter protects against price slippage, and `_deadline` ensures the transaction is processed before a specific timestamp.

```solidity
function claimFee(uint256 amount, uint256 _buffer, uint256 _deadline) external onlyOwner
```

Allows the owner to claim management fees. The function burns LP tokens, receives the underlying tokens, converts them to ETH, and sends the ETH to the owner. The `_buffer` parameter protects against price slippage during token swaps, and `_deadline` ensures the transaction is processed before a specific timestamp.

### Royalty and Interface Functions

```solidity
function royaltyInfo(uint256, uint256 _salePrice) external view override returns (address receiver, uint256 royaltyAmount)
```

Implements ERC2981 to provide royalty information when BSKT tokens are sold on marketplaces. Returns the royalty receiver address from the factory and calculates the royalty amount based on the sale price and the royalty percentage set in the factory.

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool)
```

Checks if the contract supports a specific interface. Implements ERC165 interface detection by combining OpenZeppelin's implementation with custom interfaces registered via `_registerInterface`.

```solidity
function contractURI() public view returns (string memory)
```

Returns the contract-level metadata URI from the factory contract. Used by marketplaces like OpenSea to display collection information.

### Whitelist Enforcement

```solidity
function transferFrom(address from, address to, uint256 tokenId) public override onlyWhitelistedContract(to)
```

Overrides the ERC721 transferFrom function to enforce whitelist restrictions. Only whitelisted contracts or EOAs can receive BSKT tokens.

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) public override onlyWhitelistedContract(to)
```

Overrides the ERC721 safeTransferFrom function to enforce whitelist restrictions.

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override onlyWhitelistedContract(to)
```

Overrides the ERC721 safeTransferFrom function with data parameter to enforce whitelist restrictions.

```solidity
function approve(address to, uint256 tokenId) public override onlyWhitelistedContract(to)
```

Overrides the ERC721 approve function to enforce whitelist restrictions.

```solidity
function setApprovalForAll(address operator, bool approved) public override
```

Overrides the ERC721 setApprovalForAll function to enforce whitelist restrictions when approving operators.

## Security Considerations

1. **Access Control**: The contract implements strict role-based access control through NFT ownership (token ID 0) and factory authorization for critical operations.

2. **Pausability**: While not directly implemented in the BSKT contract, the system can be paused through the Factory contract / via platform in emergency situations.

3. **Whitelist Enforcement**: Token transfers and approvals are restricted to whitelisted contracts or EOAs to prevent interactions with malicious contracts.

4. **Input Validation**: Extensive validation for token arrays, weights, buffer values, and deadlines to prevent invalid operations.

5. **Buffer Parameters**: All swap operations include buffer parameters (1-4999) to protect against price slippage and front-running attacks.

6. **Deadline Enforcement**: All swap operations include deadline parameters to ensure transactions don't execute after they become stale.

7. **ERC20 and ERC2981 Compliance**: The contract follows standard interfaces for token and royalty functionality, ensuring compatibility with wallets and marketplaces.

8. **Custom Error Usage**: Gas-efficient custom errors with descriptive names and parameters for better debugging and user experience.

9. **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard to prevent reentrancy attacks during critical operations.

10. **ALVA Token Requirement**: Enforces a minimum percentage of ALVA tokens in each basket to maintain protocol alignment.

## Contribution
Contributions to improve the BSKT contract are welcome. Please ensure that any changes maintain the contract's security and functionality. Follow the established NatSpec documentation patterns when adding or modifying code.
