// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.9/contracts/proxy/utils/Initializable.sol";

contract BoxV1 is Initializable {
    uint256 private value;

    function initialize(uint256 initialValue) public initializer {
        value = initialValue;
    }

    function setValue(uint256 newValue) public {
        value = newValue;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}