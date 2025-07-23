// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Valva is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("Valva", "VALVA")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 10000000000 * (10 ** uint256(decimals())));
        _mint(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x617F2E2fD72FD9D5503197092aC168c91465E7f2, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x17F6AD8Ef982297579C203069C1DbfFE4348c372, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678, 10000000000 * (10 ** uint256(decimals())));
    }

    function mint(address to, uint256 amount) public  {
        _mint(to, amount);
    }
}