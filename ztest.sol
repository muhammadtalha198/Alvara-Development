// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SimpleRoleManager is Initializable, AccessControlUpgradeable {
    
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    
    event RestrictedFunctionCalled(address caller, string message);

    
    function initialize() external initializer {
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
       
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    
    function restrictedFunction(string memory message) external onlyRole(ADMIN_ROLE) {
        emit RestrictedFunctionCalled(msg.sender, message);
    }

    function checkRole(bytes32 role, address account) external view returns (bool) {
        return hasRole(role, account);
    }


    // Function to grant ADMIN_ROLE to an address (restricted to DEFAULT_ADMIN_ROLE)
    function grantAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ADMIN_ROLE, account);
    }

    // Function to revoke ADMIN_ROLE from an address (restricted to DEFAULT_ADMIN_ROLE)
    function revokeAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ADMIN_ROLE, account);
    }
}
