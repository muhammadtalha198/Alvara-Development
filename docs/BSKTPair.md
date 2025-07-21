# BSKTPair Smart Contract

## Overview
The `BSKTPair` (BasketTokenStandardPair) smart contract is a Liquidity Pool (LP) token contract that manages multiple tokens within a single basket. It serves as the liquidity and valuation counterpart to each BSKT contract, allowing users to contribute and redeem their tokens based on current pool reserves. The contract implements ERC20 for liquidity tokens and acts as a liquidity pool for the specified tokens. It follows the Beacon Proxy upgradeability pattern, enabling seamless upgrades without affecting user funds.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [State Variables](#state-variables)
- [Modifiers](#modifiers)
- [Events](#events)
- [Custom Errors](#custom-errors)
- [Functions](#functions)
  - [Initialization](#initialization)
  - [External Functions](#external-functions)
  - [Public Functions](#public-functions)
  - [View Functions](#view-functions)
  - [Private Functions](#private-functions)
- [Usage](#usage)
  - [Minting LP Tokens](#minting-lp-tokens)
  - [Burning LP Tokens](#burning-lp-tokens)
  - [Management Fee Distribution](#management-fee-distribution)
- [Security Considerations](#security-considerations)
- [Contribution](#contribution)

## Architecture
BSKTPair is part of the Alvara Protocol's Beacon Proxy architecture:

1. **Implementation Contract**: The BSKTPair implementation contract contains all the logic but doesn't store any state.
   
2. **Beacon Contract**: A UpgradeableBeacon contract points to the current BSKTPair implementation address.
   
3. **Proxy Contracts**: 
   - Each BSKTPair instance is a BeaconProxy that delegates calls to the implementation pointed to by the Beacon.
   - The Factory creates these proxy instances when a user requests a new BSKT.
   - When the Beacon is updated to point to a new implementation, all BSKTPair proxies will use the new implementation.

4. **Relationship with BSKT**:
   - Each BSKTPair has a 1:1 relationship with a BSKT contract.
   - The BSKTPair is owned by its corresponding BSKT contract.
   - The BSKTPair manages the actual token reserves for the basket, while the BSKT contract handles the user interactions and business logic.
   - The BSKTPair implements ERC20 to provide LP tokens representing shares in the basket.

5. **Management Fee System**:
   - The contract includes a management fee mechanism that accrues fees over time.
   - Fees are calculated based on months elapsed since the last accrual.
   - LP tokens are minted to the owner (BSKT contract) as management fees.

6. **Reentrancy Protection**:
   - The contract implements a custom reentrancy guard for read-only functions.
   - The `nonReentrantReadOnly` modifier prevents nested calls to view functions.

This architecture allows upgrading the BSKTPair logic without affecting the state of deployed instances.

## State Variables

- **factory**: Address of the factory contract that manages the BSKTPair and BSKT contracts.
- **lastAccruedAt**: Timestamp of the last management fee accrual.
- **reentrancyGuardEntered**: Boolean flag to prevent reentrancy in read-only functions.
- **tokens**: Array of token addresses in the basket.
- **reserves**: Array of token reserves corresponding to the tokens array.

## Modifiers

- **nonReentrantReadOnly()**: Prevents reentrancy in read-only functions by checking the reentrancyGuardEntered flag. Reverts with `ReentrantCall` if reentrancy is detected.

## Events

- **FeeAccrued(address indexed owner, uint256 months, uint256 supply, uint256 amount, uint256 newAccruedAt)**: Emitted when the management fee is accrued. Includes the owner address, number of months since last accrual, current LP supply, fee amount minted, and the new accrual timestamp.

- **TokensUpdated(address[] _tokens)**: Emitted when the token list is updated with new tokens.

## Custom Errors

- **InvalidToken()**: Thrown when an invalid token is provided or when the tokens array is empty.
- **InsufficientLiquidity()**: Thrown when there is insufficient liquidity for an operation.
- **InvalidRecipient()**: Thrown when an invalid recipient address (zero address) is provided.
- **EmptyStringParameter(string paramName)**: Thrown when a required string parameter is empty.
- **ReentrantCall()**: Thrown when a reentrancy attempt is detected in read-only functions.

## Functions

### Initialization

```solidity
function initialize(address _factoryAddress, string memory _name, address[] calldata _tokens) external initializer
```

Initializes the pair contract with the factory address, ERC20 token name/symbol, and token list. Sets up the initial state including the lastAccruedAt timestamp and reserves array. This function is called by the Factory when creating a new BSKTPair.

Initializes the contract with a name, factory address, and an array of token addresses. The `_name` is appended with "-LP" to denote that it is a Liquidity Pool token. The function validates that the tokens array is not empty and the name is not empty. Sets up the ERC20 token, initializes the Ownable contract, and sets the initial token list and reserves.

### External Functions

```solidity
function transferTokensToOwner() external onlyOwner
```

Transfers all tokens to the owner (BSKT contract), typically called during basket rebalancing or other operations that require the BSKT contract to handle the tokens directly.

```solidity
function updateTokens(address[] calldata _tokens) external onlyOwner
```

Updates the token list with new tokens and emits a TokensUpdated event. This is typically called during rebalancing operations when the basket composition changes. Validates that the tokens array is not empty, updates the tokens array, and rebalances the reserves accordingly. Emits a `TokensUpdated` event.

```solidity
function mint(address _to, uint256[] calldata amounts) external onlyOwner returns (uint256 liquidity)
```

Mints new LP tokens based on the provided token amounts and transfers them to the specified address. Calculates the total ETH value of the tokens and mints LP tokens proportionally. Updates the reserves with the new token amounts. Returns the amount of LP tokens minted.

```solidity
function burn(address _to) external onlyOwner returns (uint256[] memory amounts)
```

Burns the LP tokens held by the contract and transfers the corresponding underlying tokens to the specified address. This function is only callable by the owner (BSKT contract). It calculates the token amounts based on the LP tokens being burned and updates the reserves accordingly. Returns an array of token amounts transferred.

```solidity
function setReentrancyGuardStatus(bool _state) external onlyOwner
```

Sets or resets the reentrancy guard flag for read-only functions. This is used to prevent reentrancy attacks in view functions.

### Public Functions

```solidity
function distMgmtFee() public
```

Distributes the management fee by minting LP tokens for the BSKT manager and updating the accrual time. It can be called by internal functions, external cron jobs, or manually by any account. The function calculates fees based on months elapsed since the last accrual, mints the fee tokens, and updates the accrual timestamp. Emits a `FeeAccrued` event.

### View Functions

```solidity
function calculateShareLP(uint256 _amountETH) public view nonReentrantReadOnly returns (uint256 amountLP)
```

Calculates the amount of LP tokens to be minted based on the provided ETH amount. Uses the total reserved ETH value and current LP supply to determine the proportional LP amount.

```solidity
function calculateShareETH(uint256 _amountLP) public view nonReentrantReadOnly returns (uint256 amountETH)
```

Calculates the amount of ETH corresponding to the provided LP tokens. Determines the ETH value by calculating the proportional value of each token in the basket.

```solidity
function calculateShareTokens(uint256 _amountLP) public view nonReentrantReadOnly returns (uint256[] memory amountTokens)
```

Calculates the token amounts corresponding to the provided LP tokens based on the proportion of LP tokens to the total supply. Returns an array of token amounts that would be received when burning the specified amount of LP tokens, based on the current reserves and LP supply.

```solidity
function getTokenAndUserBal(address _user) public view nonReentrantReadOnly returns (uint256[] memory, uint256, uint256)
```

Returns the token balances in the contract, the total supply of LP tokens, and the user's LP token balance.

```solidity
function calFee() public view returns (uint256 months, uint256 supply, uint256 feeAmount)
```

Calculates the management fee based on the time elapsed since last accrual. Returns the number of months since last accrual, current LP token supply, and the fee amount to be minted as new LP tokens.

```solidity
function getTokenAddress(uint256 _index) external view nonReentrantReadOnly returns (address)
```

Returns the token address at the specified index in the tokens array.

```solidity
function getTokenReserve(uint256 _index) external view nonReentrantReadOnly returns (uint256)
```

Returns the token reserve at the specified index in the reserves array.

```solidity
function getTokenList() public view nonReentrantReadOnly returns (address[] memory)
```

Returns the array of token addresses in the basket.

```solidity
function getTokensReserve() public view nonReentrantReadOnly returns (uint256[] memory)
```

Returns the array of token reserves in the basket.

```solidity
function getTotalMgmtFee() external view returns (uint)
```

Returns the total management fee by calculating the new fee and adding the existing fee balance.

### Private Functions

```solidity
function _factory() private view returns (IFactory)
```

Returns the factory instance casted to the IFactory interface. Used to avoid repeated casting of the factory address.

```solidity
function _updateRebalanceReserve() private
```

Internal function that updates the reserve amounts based on current token balances in the contract. Called after token transfers to ensure the reserves array accurately reflects the actual token balances.

```solidity
function _totalReservedETH() private view returns (uint256 totalReservedETH)
```

Calculates the sum of all reserve values in WETH equivalent by converting each token's value using the factory's price oracle functionality. This is used for LP token calculations and determining the total value of the basket.

## Usage

### Minting LP Tokens
To mint LP tokens, the owner (typically the BSKT contract) calls the `mint` function:

```solidity
function mint(address _to, uint256[] calldata amounts) external onlyOwner returns (uint256 liquidity)
```

This function calculates the appropriate amount of LP tokens based on the token amounts provided and their ETH value, then mints the tokens to the specified address. The process works as follows:

1. The function first distributes any pending management fees via `distMgmtFee()`
2. It calculates the total ETH value of the tokens being contributed using the factory's price oracle
3. It mints LP tokens proportionally to the total value

If this is the first contribution (totalSupply is 0), it initializes with 1000 ether of LP tokens. Otherwise, it calculates the share based on the proportion of the new value to the existing reserves.

### Burning LP Tokens
To burn LP tokens and retrieve the underlying tokens, the owner calls the `burn` function:

```solidity
function burn(address _to) external onlyOwner returns (uint256[] memory amounts)
```

This function burns the LP tokens held by the contract and transfers the corresponding underlying tokens to the specified address. The process works as follows:

1. The function first distributes any pending management fees via `distMgmtFee()`
2. It calculates the token amounts based on the LP tokens being burned using `calculateShareTokens()`
3. It burns the LP tokens from the contract's balance
4. It transfers the calculated token amounts to the recipient
5. It updates the reserves to reflect the new token balances

### Management Fee Distribution
The contract includes a management fee mechanism that accrues fees over time. The fee can be distributed by calling the `distMgmtFee` function:

```solidity
function distMgmtFee() public
```

This function calculates the fee based on the time elapsed since the last accrual (in months), mints LP tokens to the owner (BSKT contract) as the fee, and updates the accrual timestamp. The process works as follows:

1. The function calls `calFee()` to calculate months elapsed, current supply, and fee amount
2. If no months have passed since the last accrual, the function returns early
3. If there is a fee amount to mint, it mints LP tokens to the owner (BSKT contract)
4. It updates the `lastAccruedAt` timestamp to the current time
5. It emits a `FeeAccrued` event with details about the fee distribution

The fee calculation is performed by the factory contract via the `calMgmtFee` function.

The fee distribution happens automatically during mint and burn operations, but it can also be triggered manually by any account or by an external cron job.

## Security Considerations

1. **Access Control**: The contract implements strict role-based access control through the Ownable pattern. Only the owner (BSKT contract) can call critical functions like `mint`, `burn`, `transferTokensToOwner`, and `updateTokens`.

2. **Reentrancy Protection**: The contract uses a custom reentrancy guard for read-only functions to prevent potential reentrancy attacks during view operations. The `nonReentrantReadOnly` modifier checks the `reentrancyGuardEntered` flag to prevent nested calls.

3. **Input Validation**: Extensive validation for token addresses, recipient addresses, and array lengths to prevent invalid operations. For example, the contract checks for zero addresses and empty arrays.

4. **Safe Token Transfers**: Uses OpenZeppelin's SafeERC20 library for all token transfers to prevent common ERC20 transfer issues.

5. **Arithmetic Safety**: Uses Solidity 0.8.x's built-in overflow/underflow protection and unchecked blocks where appropriate for gas optimization.

6. **Management Fee System**: The fee accrual system is time-based and transparent, with events emitted for all fee distributions.

7. **Factory Integration**: Relies on the factory contract for critical operations like path resolution and fee calculations, ensuring consistent behavior across the protocol.

8. **Custom Error Usage**: Uses gas-efficient custom errors with descriptive names and parameters for better debugging and user experience.

9. **Upgradeability**: As part of the Beacon Proxy pattern, the contract can be upgraded to fix bugs or add features without affecting user funds.

10. **Buffer Parameters**: The BSKT contract, which interacts with BSKTPair, uses buffer parameters (1-4999) to protect against price slippage and front-running attacks during swap operations.

11. **Reserve Management**: The contract carefully tracks and updates token reserves to ensure accurate valuation and distribution of tokens.

## Contribution
Contributions to improve the BSKTPair contract are welcome. Please ensure that any changes maintain the contract's security and functionality. Follow these guidelines when contributing:

1. **Development**: Use the established development environment and follow the project's coding standards.

2. **Testing**: Add comprehensive tests for any new functionality or changes. Ensure all existing tests pass.

3. **Documentation**: Follow the established NatSpec documentation patterns when adding or modifying code. Update markdown documentation to reflect any changes.

4. **Security Considerations**: Consider security implications of any changes, especially regarding access control, token handling, and fee calculations.

5. **Pull Requests**: Submit well-documented pull requests with clear descriptions of changes and their purpose.
