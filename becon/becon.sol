// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.9/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract Beacon is UpgradeableBeacon {
    constructor(address implementation) UpgradeableBeacon(implementation) {}
}