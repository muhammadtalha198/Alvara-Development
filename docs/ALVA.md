# Alvara Smart Contract

## Overview
The ALVA smaart contract is an ERC-20 token implementation for the Alvara project, designed to operate on the Ethereum blockchain. It is an upgradeable token contract that includes burnable functionality, supports supervised transfers, and implements a grey list security feature. The initial supply of `ALVA` tokens is minted to the contract deployer's address upon initialization.

## Table of Contents
- [Features](#features)
- [Contract Details](#contract-details)
  - [Contract Name](#contract-name)
  - [Inheritance](#inheritance)
  - [Initialization](#initialization)
  - [Functions](#functions)
- [Deployment](#deployment)
- [Directory Structure](#directory-structure)
- [WithSupervisedTransfers Smart Contract](#wthSupervisedTransfers-smart-contract)
  - [Overview](#overview)
  - [Features](#features)
  - [Contract Details](#contract-details)
  - [Usage](#usage)
- [Contribution](#contribution)


## Features
- **ERC-20 Token**: Implements the standard ERC-20 interface for fungible tokens.
- **Upgradeable**: The contract uses OpenZeppelin's upgradeable patterns, allowing for future updates and improvements.
- **Burnable**: Users can burn their tokens to reduce the total supply.
- **Supervised Transfers**: Transfers are subject to supervision, adding an additional layer of control.
- **Grey List Management**: Security mechanism to restrict transfers from specific addresses, managed by designated role holders.


## Contract Details

### Contract Name
- **Alvara** (`ALVA`)

### Inheritance
The `Alvara` contract inherits from the following contracts:

- `ERC20Upgradeable`: Provides the standard ERC-20 token functionality in an upgradeable context.
- `ERC20BurnableUpgradeable`: Allows users to burn their tokens.
- `WithSupervisedTransfers`: A custom contract that adds supervision functionality to token transfers. This contract itself inherits from `AccessControlUpgradeable` to manage roles and permissions.


### Initialization
The contract's `initialize` function sets up the token with the following details:

- **Name**: `Alvara`
- **Symbol**: `ALVA`
- **Initial Supply**: `200,000,000 ALVA` tokens, minted to the deployer's address.


### Functions
- `initialize()`: Initializes the contract, setting the token's name, symbol, and minting the initial supply.
- `transferFrom(address from, address to, uint256 amount)`: Overrides the standard `transferFrom` function to include supervision using the `supervisedTransferFrom` modifier.
- `addToGreyList(address account)`: Adds an address to the grey list, restricting its ability to transfer tokens. Only callable by users with `GREYLIST_MANAGER_ROLE`.
- `removeFromGreyList(address account)`: Removes an address from the grey list. Only callable by users with `GREYLIST_MANAGER_ROLE`.
- `isGreyListed(address account)`: Checks if an address is on the grey list, returning a boolean result.

### Roles
- **DEFAULT_ADMIN_ROLE**: Inherited from `WithSupervisedTransfers`, manages other roles and updates the listing timestamp.
- **ALLOWED_TRANSFER_FROM_ROLE**: Inherited from `WithSupervisedTransfers`, addresses permitted to receive tokens via `transferFrom` before listing.
- **GREYLIST_MANAGER_ROLE**: Manages the grey list, with permissions to add or remove addresses from the list.

### Events
- **ListingTimestampUpdated**: Inherited from `WithSupervisedTransfers`, emitted when the listing timestamp is updated.
- **GreyListed**: Emitted when an address is added to the grey list.
- **RemovedFromGreyList**: Emitted when an address is removed from the grey list.

### Custom Errors
- **TokenAlreadyListed**: Inherited from `WithSupervisedTransfers`, thrown when attempting to update the listing timestamp after the token has been listed.
- **SupervisedTransferFrom**: Inherited from `WithSupervisedTransfers`, thrown when an unauthorized transfer is attempted before listing.
- **ActionRestricted**: Thrown when a greylisted address attempts to transfer tokens.
- **AddressAlreadyGreylisted**: Thrown when attempting to add an address that is already on the grey list.
- **AddressNotInGreyList**: Thrown when attempting to remove an address that is not on the grey list.


## Deployment
To deploy the ALVA smart contract:

1. Ensure your environment is set up with Solidity version `0.8.9` and OpenZeppelin contracts.
2. Compile the contract using your preferred Solidity compiler.
3. Deploy the contract to your desired Ethereum network.
4. Call the `initialize` function to mint the initial supply of tokens.

### Implementation Upgrade Steps
For upgrading to a new implementation (e.g., ALVA-V2):

1. Deploy the new implementation contract to the target network.
2. Verify the contract on the blockchain explorer for transparency.
3. Upgrade the implementation address in the proxy to point to the new contract.
4. Assign the `GREYLIST_MANAGER_ROLE` to the designated address.
5. Configure the grey list as needed by adding addresses that should be restricted.

### Mainnet Deployment Details
- **ALVA V2 Token Implementation Address**: `0x5669Fa5a70ce0837Dfca8C71EDA8C9C7e3177C08`
- **Etherscan URL**: [https://etherscan.io/address/0x5669Fa5a70ce0837Dfca8C71EDA8C9C7e3177C08#code](https://etherscan.io/address/0x5669Fa5a70ce0837Dfca8C71EDA8C9C7e3177C08#code)


## Directory Structure
```plaintext
/contracts
  ├── tokens
  |   └── Alvara.sol             # The Alvara token contract
  └── utils
      └── WithSupervisedTransfers.sol  # Utility contract for supervised transfers
```

## Grey List Feature

### Description
The grey list feature is a security mechanism designed to restrict specific actions for addresses on the list, particularly blocking them from transferring tokens. This provides an additional layer of protection against malicious actors or compromised wallets.

### Implementation Details
- **Storage**: Uses a private mapping `_greyList` to track greylisted addresses.
- **Access Control**: Only addresses with the `GREYLIST_MANAGER_ROLE` can modify the grey list.
- **Transfer Restriction**: The `_transfer` function is overridden to check if the sender is greylisted before allowing any token transfer.

### Integration with Transfer Logic
The grey list check is performed in the `_transfer` function before any token movement occurs:
```solidity
function _transfer(
    address from, 
    address to, 
    uint256 amount
    ) internal override {
        if (_greyList[from]) {
            revert ActionRestricted(); // Restrict Grey Listed address from performing transfer action
        }
        super._transfer(from, to, amount);
}
```



# WithSupervisedTransfers Smart Contract

## Overview
The `WithSupervisedTransfers` contract is an abstract contract designed to add supervised transfer functionality to ERC-20 tokens. It allows an administrator to control token transfers before a listing date by whitelisting addresses that are permitted to receive the token through the `transferFrom` method and control liquidity for Dexs. Once the token is listed (i.e., made tradable on a decentralized exchange), the supervision of transfers is permanently disabled.


## Features
- **Access Control**: The contract uses OpenZeppelin's `AccessControlUpgradeable` to manage roles and permissions, ensuring only authorized addresses can interact with restricted functions.
- **Supervised Transfers**: Before the listing date, transfers are restricted to only whitelisted addresses, or those involving an admin, providing control over token distribution.
- **Listing Timestamp**: The contract tracks when the token becomes fully tradeable, after which transfer supervision is permanently disabled.


## Contract Details
### Roles
- **DEFAULT_ADMIN_ROLE**: The admin role, usually granted to the contract deployer, with the ability to manage other roles and update the listing timestamp.
- **ALLOWED_TRANSFER_FROM_ROLE**: The role given to addresses that are permitted to receive tokens via the `transferFrom` method before the token is listed.


### Key Events
- **ListingTimestampUpdated(uint32 newListingTimestamp)**: Emitted whenever the listing timestamp is updated, allowing for easy off-chain tracking of when the token will become fully tradeable.


### Errors
- **TokenAlreadyListed**: Thrown when attempting to update the listing timestamp after the token has already been listed.
- **SupervisedTransferFrom**: Thrown when an unauthorized transfer is attempted before the listing.


### Functions
- **__WithSupervisedTransfers_init()**: Initializes the contract by granting the admin role to the deployer.
- **setListingTimestamp(uint32 newListingTimestamp)**: Allows the admin to specify the epoch time when the token should become tradeable. Once set, this timestamp cannot be changed after it has passed.


### Modifier
- **supervisedTransferFrom(address from, address to)**: Restricts the `transferFrom` function before the listing to ensure only authorized addresses or transactions involving an admin are allowed.


## Usage

### Deployment
To use `WithSupervisedTransfers`, the contract must be inherited by another contract (such as an ERC-20 token contract). The inheriting contract should call the `__WithSupervisedTransfers_init()` function during its initialization phase.

### Example Usage

```solidity
contract MyToken is ERC20Upgradeable, WithSupervisedTransfers {
    function initialize() public initializer {
        __ERC20_init("MyToken", "MTK");
        __WithSupervisedTransfers_init();

        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        supervisedTransferFrom(from, to) 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }
}
```


## Contribution
We welcome contributions from the community to improve and expand the Alvara platform. If you're interested in contributing, please read our [Contribution Guidelines](./docs/Contribution.md) to understand how to get started.
