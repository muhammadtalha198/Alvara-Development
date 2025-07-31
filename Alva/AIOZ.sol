
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Aioz is ERC20, ERC20Burnable, Ownable {
    constructor()
        ERC20("Aioz", "AIOZ")
        Ownable(msg.sender)
    {
        _mint(msg.sender, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x6DdCE86b55741e1fb71999a24C9BD95Db18c934F, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x21AA71269Ddb5f5fD0993b6ADfD930dde2B0518C, 10000000000 * (10 ** uint256(decimals())));
        _mint(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db, 10000000000 * (10 ** uint256(decimals())));
        _mint(0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB, 10000000000 * (10 ** uint256(decimals())));
        
    }

    function mint(address to, uint256 amount) public  {
        _mint(to, amount);
    }
}