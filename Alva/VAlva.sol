

// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Valva is ERC20, ERC20Burnable, Ownable {
    constructor()
        ERC20("Valva", "VALVA")
         Ownable(msg.sender)
    {
        _mint(msg.sender, 10000000000 * (10 ** uint256(decimals())));
        _mint(msg.sender, 10000000000 * (10 ** uint256(decimals())));
        
    }

    function mint(address to, uint256 amount) public  {
        _mint(to, amount);
    }
}