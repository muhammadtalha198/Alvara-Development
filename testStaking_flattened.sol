
// File: @openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol
// SPDX-License-Identifier: MIT

// OpenZeppelin Contracts v4.4.1 (access/IAccessControl.sol)

pragma solidity ^0.8.0;

/**
 * @dev External interface of AccessControl declared to support ERC165 detection.
 */
interface IAccessControlUpgradeable {
    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     *
     * _Available since v3.1._
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call, an admin role
     * bearer except when using {AccessControl-_setupRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     */
    function renounceRole(bytes32 role, address account) external;
}

// File: @openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol


// OpenZeppelin Contracts (last updated v4.9.0) (utils/Address.sol)

pragma solidity ^0.8.1;

/**
 * @dev Collection of functions related to the address type
 */
library AddressUpgradeable {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     *
     * Furthermore, `isContract` will also return true if the target contract within
     * the same transaction is already scheduled for destruction by `SELFDESTRUCT`,
     * which only has an effect at the end of a transaction.
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.0/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and revert (either by bubbling
     * the revert reason or using the provided one) in case of unsuccessful call or if target was not a contract.
     *
     * _Available since v4.8._
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason or using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}

// File: @openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol


// OpenZeppelin Contracts (last updated v4.9.0) (proxy/utils/Initializable.sol)

pragma solidity ^0.8.2;


/**
 * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
 * behind a proxy. Since proxied contracts do not make use of a constructor, it's common to move constructor logic to an
 * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
 * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.
 *
 * The initialization functions use a version number. Once a version number is used, it is consumed and cannot be
 * reused. This mechanism prevents re-execution of each "step" but allows the creation of new initialization steps in
 * case an upgrade adds a module that needs to be initialized.
 *
 * For example:
 *
 * [.hljs-theme-light.nopadding]
 * ```solidity
 * contract MyToken is ERC20Upgradeable {
 *     function initialize() initializer public {
 *         __ERC20_init("MyToken", "MTK");
 *     }
 * }
 *
 * contract MyTokenV2 is MyToken, ERC20PermitUpgradeable {
 *     function initializeV2() reinitializer(2) public {
 *         __ERC20Permit_init("MyToken");
 *     }
 * }
 * ```
 *
 * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
 * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.
 *
 * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
 * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.
 *
 * [CAUTION]
 * ====
 * Avoid leaving a contract uninitialized.
 *
 * An uninitialized contract can be taken over by an attacker. This applies to both a proxy and its implementation
 * contract, which may impact the proxy. To prevent the implementation contract from being used, you should invoke
 * the {_disableInitializers} function in the constructor to automatically lock it when it is deployed:
 *
 * [.hljs-theme-light.nopadding]
 * ```
 * /// @custom:oz-upgrades-unsafe-allow constructor
 * constructor() {
 *     _disableInitializers();
 * }
 * ```
 * ====
 */
abstract contract Initializable {
    /**
     * @dev Indicates that the contract has been initialized.
     * @custom:oz-retyped-from bool
     */
    uint8 private _initialized;

    /**
     * @dev Indicates that the contract is in the process of being initialized.
     */
    bool private _initializing;

    /**
     * @dev Triggered when the contract has been initialized or reinitialized.
     */
    event Initialized(uint8 version);

    /**
     * @dev A modifier that defines a protected initializer function that can be invoked at most once. In its scope,
     * `onlyInitializing` functions can be used to initialize parent contracts.
     *
     * Similar to `reinitializer(1)`, except that functions marked with `initializer` can be nested in the context of a
     * constructor.
     *
     * Emits an {Initialized} event.
     */
    modifier initializer() {
        bool isTopLevelCall = !_initializing;
        require(
            (isTopLevelCall && _initialized < 1) || (!AddressUpgradeable.isContract(address(this)) && _initialized == 1),
            "Initializable: contract is already initialized"
        );
        _initialized = 1;
        if (isTopLevelCall) {
            _initializing = true;
        }
        _;
        if (isTopLevelCall) {
            _initializing = false;
            emit Initialized(1);
        }
    }

    /**
     * @dev A modifier that defines a protected reinitializer function that can be invoked at most once, and only if the
     * contract hasn't been initialized to a greater version before. In its scope, `onlyInitializing` functions can be
     * used to initialize parent contracts.
     *
     * A reinitializer may be used after the original initialization step. This is essential to configure modules that
     * are added through upgrades and that require initialization.
     *
     * When `version` is 1, this modifier is similar to `initializer`, except that functions marked with `reinitializer`
     * cannot be nested. If one is invoked in the context of another, execution will revert.
     *
     * Note that versions can jump in increments greater than 1; this implies that if multiple reinitializers coexist in
     * a contract, executing them in the right order is up to the developer or operator.
     *
     * WARNING: setting the version to 255 will prevent any future reinitialization.
     *
     * Emits an {Initialized} event.
     */
    modifier reinitializer(uint8 version) {
        require(!_initializing && _initialized < version, "Initializable: contract is already initialized");
        _initialized = version;
        _initializing = true;
        _;
        _initializing = false;
        emit Initialized(version);
    }

    /**
     * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the
     * {initializer} and {reinitializer} modifiers, directly or indirectly.
     */
    modifier onlyInitializing() {
        require(_initializing, "Initializable: contract is not initializing");
        _;
    }

    /**
     * @dev Locks the contract, preventing any future reinitialization. This cannot be part of an initializer call.
     * Calling this in the constructor of a contract will prevent that contract from being initialized or reinitialized
     * to any version. It is recommended to use this to lock implementation contracts that are designed to be called
     * through proxies.
     *
     * Emits an {Initialized} event the first time it is successfully executed.
     */
    function _disableInitializers() internal virtual {
        require(!_initializing, "Initializable: contract is initializing");
        if (_initialized != type(uint8).max) {
            _initialized = type(uint8).max;
            emit Initialized(type(uint8).max);
        }
    }

    /**
     * @dev Returns the highest version that has been initialized. See {reinitializer}.
     */
    function _getInitializedVersion() internal view returns (uint8) {
        return _initialized;
    }

    /**
     * @dev Returns `true` if the contract is currently initializing. See {onlyInitializing}.
     */
    function _isInitializing() internal view returns (bool) {
        return _initializing;
    }
}

// File: @openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol


// OpenZeppelin Contracts (last updated v4.9.4) (utils/Context.sol)

pragma solidity ^0.8.0;


/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract ContextUpgradeable is Initializable {
    function __Context_init() internal onlyInitializing {
    }

    function __Context_init_unchained() internal onlyInitializing {
    }
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}

// File: @openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol


// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/Math.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library MathUpgradeable {
    enum Rounding {
        Down, // Toward negative infinity
        Up, // Toward infinity
        Zero // Toward zero
    }

    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow.
        return (a & b) + (a ^ b) / 2;
    }

    /**
     * @dev Returns the ceiling of the division of two numbers.
     *
     * This differs from standard division with `/` in that it rounds up instead
     * of rounding down.
     */
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b - 1) / b can overflow on addition, so we distribute.
        return a == 0 ? 0 : (a - 1) / b + 1;
    }

    /**
     * @notice Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
     * @dev Original credit to Remco Bloemen under MIT license (https://xn--2-umb.com/21/muldiv)
     * with further edits by Uniswap Labs also under MIT license.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            // 512-bit multiply [prod1 prod0] = x * y. Compute the product mod 2^256 and mod 2^256 - 1, then use
            // use the Chinese Remainder Theorem to reconstruct the 512 bit result. The result is stored in two 256
            // variables such that product = prod1 * 2^256 + prod0.
            uint256 prod0; // Least significant 256 bits of the product
            uint256 prod1; // Most significant 256 bits of the product
            assembly {
                let mm := mulmod(x, y, not(0))
                prod0 := mul(x, y)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }

            // Handle non-overflow cases, 256 by 256 division.
            if (prod1 == 0) {
                // Solidity will revert if denominator == 0, unlike the div opcode on its own.
                // The surrounding unchecked block does not change this fact.
                // See https://docs.soliditylang.org/en/latest/control-structures.html#checked-or-unchecked-arithmetic.
                return prod0 / denominator;
            }

            // Make sure the result is less than 2^256. Also prevents denominator == 0.
            require(denominator > prod1, "Math: mulDiv overflow");

            ///////////////////////////////////////////////
            // 512 by 256 division.
            ///////////////////////////////////////////////

            // Make division exact by subtracting the remainder from [prod1 prod0].
            uint256 remainder;
            assembly {
                // Compute remainder using mulmod.
                remainder := mulmod(x, y, denominator)

                // Subtract 256 bit number from 512 bit number.
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            // Factor powers of two out of denominator and compute largest power of two divisor of denominator. Always >= 1.
            // See https://cs.stackexchange.com/q/138556/92363.

            // Does not overflow because the denominator cannot be zero at this stage in the function.
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                // Divide denominator by twos.
                denominator := div(denominator, twos)

                // Divide [prod1 prod0] by twos.
                prod0 := div(prod0, twos)

                // Flip twos such that it is 2^256 / twos. If twos is zero, then it becomes one.
                twos := add(div(sub(0, twos), twos), 1)
            }

            // Shift in bits from prod1 into prod0.
            prod0 |= prod1 * twos;

            // Invert denominator mod 2^256. Now that denominator is an odd number, it has an inverse modulo 2^256 such
            // that denominator * inv = 1 mod 2^256. Compute the inverse by starting with a seed that is correct for
            // four bits. That is, denominator * inv = 1 mod 2^4.
            uint256 inverse = (3 * denominator) ^ 2;

            // Use the Newton-Raphson iteration to improve the precision. Thanks to Hensel's lifting lemma, this also works
            // in modular arithmetic, doubling the correct bits in each step.
            inverse *= 2 - denominator * inverse; // inverse mod 2^8
            inverse *= 2 - denominator * inverse; // inverse mod 2^16
            inverse *= 2 - denominator * inverse; // inverse mod 2^32
            inverse *= 2 - denominator * inverse; // inverse mod 2^64
            inverse *= 2 - denominator * inverse; // inverse mod 2^128
            inverse *= 2 - denominator * inverse; // inverse mod 2^256

            // Because the division is now exact we can divide by multiplying with the modular inverse of denominator.
            // This will give us the correct result modulo 2^256. Since the preconditions guarantee that the outcome is
            // less than 2^256, this is the final result. We don't need to compute the high bits of the result and prod1
            // is no longer required.
            result = prod0 * inverse;
            return result;
        }
    }

    /**
     * @notice Calculates x * y / denominator with full precision, following the selected rounding direction.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator, Rounding rounding) internal pure returns (uint256) {
        uint256 result = mulDiv(x, y, denominator);
        if (rounding == Rounding.Up && mulmod(x, y, denominator) > 0) {
            result += 1;
        }
        return result;
    }

    /**
     * @dev Returns the square root of a number. If the number is not a perfect square, the value is rounded down.
     *
     * Inspired by Henry S. Warren, Jr.'s "Hacker's Delight" (Chapter 11).
     */
    function sqrt(uint256 a) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        // For our first guess, we get the biggest power of 2 which is smaller than the square root of the target.
        //
        // We know that the "msb" (most significant bit) of our target number `a` is a power of 2 such that we have
        // `msb(a) <= a < 2*msb(a)`. This value can be written `msb(a)=2**k` with `k=log2(a)`.
        //
        // This can be rewritten `2**log2(a) <= a < 2**(log2(a) + 1)`
        // → `sqrt(2**k) <= sqrt(a) < sqrt(2**(k+1))`
        // → `2**(k/2) <= sqrt(a) < 2**((k+1)/2) <= 2**(k/2 + 1)`
        //
        // Consequently, `2**(log2(a) / 2)` is a good first approximation of `sqrt(a)` with at least 1 correct bit.
        uint256 result = 1 << (log2(a) >> 1);

        // At this point `result` is an estimation with one bit of precision. We know the true value is a uint128,
        // since it is the square root of a uint256. Newton's method converges quadratically (precision doubles at
        // every iteration). We thus need at most 7 iteration to turn our partial result with one bit of precision
        // into the expected uint128 result.
        unchecked {
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            return min(result, a / result);
        }
    }

    /**
     * @notice Calculates sqrt(a), following the selected rounding direction.
     */
    function sqrt(uint256 a, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = sqrt(a);
            return result + (rounding == Rounding.Up && result * result < a ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 2, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 128;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 64;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 32;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 16;
            }
            if (value >> 8 > 0) {
                value >>= 8;
                result += 8;
            }
            if (value >> 4 > 0) {
                value >>= 4;
                result += 4;
            }
            if (value >> 2 > 0) {
                value >>= 2;
                result += 2;
            }
            if (value >> 1 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 2, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log2(value);
            return result + (rounding == Rounding.Up && 1 << result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 10, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) {
                value /= 10 ** 64;
                result += 64;
            }
            if (value >= 10 ** 32) {
                value /= 10 ** 32;
                result += 32;
            }
            if (value >= 10 ** 16) {
                value /= 10 ** 16;
                result += 16;
            }
            if (value >= 10 ** 8) {
                value /= 10 ** 8;
                result += 8;
            }
            if (value >= 10 ** 4) {
                value /= 10 ** 4;
                result += 4;
            }
            if (value >= 10 ** 2) {
                value /= 10 ** 2;
                result += 2;
            }
            if (value >= 10 ** 1) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 10, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log10(value);
            return result + (rounding == Rounding.Up && 10 ** result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 256, rounded down, of a positive value.
     * Returns 0 if given 0.
     *
     * Adding one to the result gives the number of pairs of hex symbols needed to represent `value` as a hex string.
     */
    function log256(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 16;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 8;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 4;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 2;
            }
            if (value >> 8 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 256, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log256(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log256(value);
            return result + (rounding == Rounding.Up && 1 << (result << 3) < value ? 1 : 0);
        }
    }
}

// File: @openzeppelin/contracts-upgradeable/utils/math/SignedMathUpgradeable.sol


// OpenZeppelin Contracts (last updated v4.8.0) (utils/math/SignedMath.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard signed math utilities missing in the Solidity language.
 */
library SignedMathUpgradeable {
    /**
     * @dev Returns the largest of two signed numbers.
     */
    function max(int256 a, int256 b) internal pure returns (int256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two signed numbers.
     */
    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two signed numbers without overflow.
     * The result is rounded towards zero.
     */
    function average(int256 a, int256 b) internal pure returns (int256) {
        // Formula from the book "Hacker's Delight"
        int256 x = (a & b) + ((a ^ b) >> 1);
        return x + (int256(uint256(x) >> 255) & (a ^ b));
    }

    /**
     * @dev Returns the absolute unsigned value of a signed value.
     */
    function abs(int256 n) internal pure returns (uint256) {
        unchecked {
            // must be unchecked in order to support `n = type(int256).min`
            return uint256(n >= 0 ? n : -n);
        }
    }
}

// File: @openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol


// OpenZeppelin Contracts (last updated v4.9.0) (utils/Strings.sol)

pragma solidity ^0.8.0;



/**
 * @dev String operations.
 */
library StringsUpgradeable {
    bytes16 private constant _SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = MathUpgradeable.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    /**
     * @dev Converts a `int256` to its ASCII `string` decimal representation.
     */
    function toString(int256 value) internal pure returns (string memory) {
        return string(abi.encodePacked(value < 0 ? "-" : "", toString(SignedMathUpgradeable.abs(value))));
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, MathUpgradeable.log256(value) + 1);
        }
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function equal(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}

// File: @openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol


// OpenZeppelin Contracts v4.4.1 (utils/introspection/IERC165.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[EIP].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165Upgradeable {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// File: @openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol


// OpenZeppelin Contracts v4.4.1 (utils/introspection/ERC165.sol)

pragma solidity ^0.8.0;



/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 *
 * Alternatively, {ERC165Storage} provides an easier to use but more expensive implementation.
 */
abstract contract ERC165Upgradeable is Initializable, IERC165Upgradeable {
    function __ERC165_init() internal onlyInitializing {
    }

    function __ERC165_init_unchained() internal onlyInitializing {
    }
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165Upgradeable).interfaceId;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}

// File: @openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol


// OpenZeppelin Contracts (last updated v4.9.0) (access/AccessControl.sol)

pragma solidity ^0.8.0;






/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControlUpgradeable is Initializable, ContextUpgradeable, IAccessControlUpgradeable, ERC165Upgradeable {
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with a standardized message including the required role.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     *
     * _Available since v4.1._
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    function __AccessControl_init() internal onlyInitializing {
    }

    function __AccessControl_init_unchained() internal onlyInitializing {
    }
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControlUpgradeable).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual override returns (bool) {
        return _roles[role].members[account];
    }

    /**
     * @dev Revert with a standard message if `_msgSender()` is missing `role`.
     * Overriding this function changes the behavior of the {onlyRole} modifier.
     *
     * Format of the revert message is described in {_checkRole}.
     *
     * _Available since v4.6._
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Revert with a standard message if `account` is missing `role`.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        StringsUpgradeable.toHexString(account),
                        " is missing role ",
                        StringsUpgradeable.toHexString(uint256(role), 32)
                    )
                )
            );
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual override returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address account) public virtual override {
        require(account == _msgSender(), "AccessControl: can only renounce roles for self");

        _revokeRole(role, account);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event. Note that unlike {grantRole}, this function doesn't perform any
     * checks on the calling account.
     *
     * May emit a {RoleGranted} event.
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial roles for the system.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {AccessControl}.
     * ====
     *
     * NOTE: This function is deprecated in favor of {_grantRole}.
     */
    function _setupRole(bytes32 role, address account) internal virtual {
        _grantRole(role, account);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, _msgSender());
        }
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, _msgSender());
        }
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}

// File: @openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol


// OpenZeppelin Contracts (last updated v4.7.0) (security/Pausable.sol)

pragma solidity ^0.8.0;



/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract PausableUpgradeable is Initializable, ContextUpgradeable {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    function __Pausable_init() internal onlyInitializing {
        __Pausable_init_unchained();
    }

    function __Pausable_init_unchained() internal onlyInitializing {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}

// File: testStaking.sol


pragma solidity ^0.8.20;




interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function burn(uint256 amount) external; 

    function burnTokens(address account, uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;

    function mint(address account, uint256 amount) external;
}



contract AlvaStaking is Initializable, PausableUpgradeable, AccessControlUpgradeable {
    IERC20 private ALVA;
    IERC20 private veALVA;

    uint private constant RATIO_FACTOR = 10 ** 8;
    uint private constant PERCENTAGE_FACTOR = 10 ** 7;
    uint private constant REWARD_PERIOD = 10 minutes;

    bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 private constant REWARDS_ALLOCATOR_ROLE = keccak256("REWARDS_ALLOCATOR_ROLE");

    struct poolData {
        bool status;
        uint veAlvaRatio;
        uint poolPercentage;
        uint duration;
        uint amountLocked;
        uint rewardPeriods;
    }

    struct Stake {
        string pool;
        uint amount;
        bool isForever;
        bool isActive;
        uint duration;
        uint startTime;
        uint endTime;
        uint votingPower;
        uint rewardsCurrent;
        uint openingRewardId;
        uint closingRewardId;
        uint totalIncremented;
        mapping(uint => uint) rewardIdToIncrementedAmount;
    }

    struct rewardData {
        bool isProcessed;
        uint timestamp;
        uint amount;
        mapping(string => uint) poolToAmountLocked;
        mapping(string => uint) poolToNewAmount;
        mapping(string => uint) poolToExpiredAmount;
    }

    string[] public Pools;
    uint public stakeId;
    uint public currentIdRewards;
    uint public decayInterval;
    uint public minimumStakingAmount;
    uint public minimumRewardAmount;
    uint public vaultWithdrawalPercentage;
    uint public startTime;
    uint public unallocatedRewards;

    mapping(address => uint[]) public userStakeIds;
    mapping(address => uint[]) public rewardEligibleIds;
    
    mapping(address => uint) public claimedRewardId;
    mapping(address => uint) public userReward;
    mapping(address => uint) public foreverStakeId;
    
    mapping(string => poolData) public poolInfo;
    mapping(uint => Stake) public stakeInfo;
    mapping(uint => rewardData) public rewardInfo;

    event TokensStaked(uint indexed _stakeId, address indexed account, uint amount, string pool, uint veAlva);
    event StakedAmountIncreased(uint indexed _stakeId, uint amount, uint veAlva);
    event LockRenewed(uint indexed previousLockId, uint indexed newLockId);
    event Compounded(uint indexed _stakeId, uint amount, uint rewardAmount, uint veAlva);
    event Withdrawn(address indexed account, uint indexed _stakeId, uint endTime);
    event RewardsClaimed(address indexed account, uint rewardAmount);
    event RewardsAdded(uint indexed rewardId, uint amount);
    event RewardsCorrected(address indexed account, uint rewardAmount);

    constructor() {
        // _disableInitializers();
    }

    //["FOREVER","FiveMinutes"]
    // [4000000,6000000]
    // [200000000,150000000]
    // [0,14400];  
    // [0,1500];   cycles 
    // [999999,8]; REWARD_PERIOD = 5 minutes.
 

    // [999999,48]; REWARD_PERIOD = 5 minutes.
    // [999999,24]; REWARD_PERIOD = 10 minutes.

    function initialize(
        address _alva,
        address _veAlva,
        uint _decayInterval,
        uint _startTime,
        string[] memory _pools,
        uint[] memory rewards,
        uint[] memory veTokenRatio,
        uint[] memory duration,
        uint[] memory rewardPeriods
    ) external initializer {
        require(_alva != address(0), "Invalid ALVA token address");
        require(_veAlva != address(0), "Invalid veALVA token address");

        ALVA = IERC20(_alva);
        veALVA = IERC20(_veAlva);
        decayInterval = _decayInterval;
        startTime = _startTime;
        minimumStakingAmount = 1;
        minimumRewardAmount = 10000;
        vaultWithdrawalPercentage = 5000000;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REWARDS_ALLOCATOR_ROLE, msg.sender);

        require(duration[0] == 0, "Invalid Durations");

        uint totalRewardPercentage;
        Pools = _pools;

        for (uint i; i < _pools.length; i++) {
            poolInfo[_pools[i]].veAlvaRatio = veTokenRatio[i];
            poolInfo[_pools[i]].poolPercentage = rewards[i];
            poolInfo[_pools[i]].duration = duration[i];
            poolInfo[_pools[i]].status = true;
            poolInfo[_pools[i]].rewardPeriods = rewardPeriods[i];
            totalRewardPercentage += rewards[i];
        }
        require(totalRewardPercentage == PERCENTAGE_FACTOR, "Invalid Rewards");
    }

    function stake(uint amount, string memory _poolName) public whenNotPaused {
        require(amount >= minimumStakingAmount, "Amount is below the minimum required");
        _stake(amount, 0, 0, _poolName, rewardPeriodCount());
    }

    function _stake(
        uint amountNew,
        uint amountOld,
        uint votingPowerOld,
        string memory _poolName,
        uint _rewardPeriodCount
    ) internal {

        require(poolInfo[_poolName].status, "The _poolName is not available for staking");

        stakeId++;

        uint rewardIdExpired = _rewardPeriodCount + poolInfo[_poolName].rewardPeriods;
        uint amountTotal = amountNew + amountOld;
        uint votingPowerTotal = getveAlvaAmount(amountTotal, _poolName);

        if (votingPowerTotal > votingPowerOld)
            veALVA.mint(msg.sender, votingPowerTotal - votingPowerOld);

        if (poolInfo[_poolName].duration != 0) {
            
            require(getActiveLockId(msg.sender) == 0, "Timebase lock already exists");

            userStakeIds[msg.sender].push(stakeId);

            if (poolInfo[_poolName].poolPercentage > 0)
                rewardEligibleIds[msg.sender].push(stakeId);

            if (amountNew > 0)
                ALVA.transferFrom(msg.sender, address(this), amountNew);

            rewardInfo[rewardIdExpired].poolToExpiredAmount[_poolName] += amountTotal;
        } else {
            require(foreverStakeId[msg.sender] == 0, "Forever lock already exists");

            foreverStakeId[msg.sender] = stakeId;
            stakeInfo[stakeId].isForever = true;
        }

        stakeInfo[stakeId].pool = _poolName;
        stakeInfo[stakeId].amount = amountTotal;
        stakeInfo[stakeId].duration = poolInfo[_poolName].duration;
        stakeInfo[stakeId].startTime = block.timestamp;
        stakeInfo[stakeId].endTime = block.timestamp + poolInfo[_poolName].duration;
        stakeInfo[stakeId].votingPower = votingPowerTotal;
        stakeInfo[stakeId].isActive = true;
        stakeInfo[stakeId].openingRewardId = _rewardPeriodCount;
        stakeInfo[stakeId].closingRewardId = rewardIdExpired;

        rewardInfo[_rewardPeriodCount].poolToNewAmount[_poolName] += amountTotal;

        emit TokensStaked(stakeId, msg.sender, amountTotal, _poolName, votingPowerTotal);
    }

    function claimRewards() public whenNotPaused {
        
        uint reward = _claimRewards();
        ALVA.transfer(msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, reward);
    }

    function _claimRewards() internal returns (uint reward) {
        
        if (rewardEligibleIds[msg.sender].length > claimedRewardId[msg.sender]) {
            _finalizeTimeBaseRewards(rewardEligibleIds[msg.sender][claimedRewardId[msg.sender]]);
        }

        _finalizeForeverLockRewards();
        reward = userReward[msg.sender];

        require(reward > 0, "No rewards available for claiming");
        userReward[msg.sender] = 0;
    }

    function _finalizeTimeBaseRewards(uint _stakeId) internal {
        
        if (_stakeId != 0 && stakeInfo[_stakeId].openingRewardId < stakeInfo[_stakeId].closingRewardId) {

            uint rewardAmount;
            uint incrementedAmount;
            
            (rewardAmount, stakeInfo[_stakeId].openingRewardId, incrementedAmount) = countRewards(_stakeId, 10);

            stakeInfo[_stakeId].rewardsCurrent += rewardAmount;
            userReward[msg.sender] += rewardAmount;
            

            stakeInfo[_stakeId].rewardIdToIncrementedAmount[stakeInfo[_stakeId].openingRewardId] = incrementedAmount;

            if (stakeInfo[_stakeId].openingRewardId == stakeInfo[_stakeId].closingRewardId) {
                claimedRewardId[msg.sender]++;
            }
        }
    }

    function _finalizeForeverLockRewards() internal {
        uint _stakeId = foreverStakeId[msg.sender];
        if (_stakeId != 0 && stakeInfo[_stakeId].openingRewardId < currentIdRewards) {
            uint rewardAmount;
            uint incrementedAmount;
            (rewardAmount, stakeInfo[_stakeId].openingRewardId, incrementedAmount) = countRewards(_stakeId, 10);

            stakeInfo[_stakeId].rewardsCurrent += rewardAmount;
            userReward[msg.sender] += rewardAmount;
            stakeInfo[_stakeId].rewardIdToIncrementedAmount[stakeInfo[_stakeId].openingRewardId] = incrementedAmount;
        }
    }

    function countRewards(uint _stakeId, uint batchSize) public view returns (uint rewardAmount, uint openingRewardId, uint incrementedAmount) {
        
        Stake storage _stakeData = stakeInfo[_stakeId];

        require(_stakeData.amount > 0, "Invalid Lock Id");

        uint closingId = _stakeData.isForever ? currentIdRewards : _stakeData.closingRewardId;

        openingRewardId = _stakeData.openingRewardId;

        uint endingId = openingRewardId + batchSize;

        incrementedAmount = _stakeData.rewardIdToIncrementedAmount[openingRewardId];

        for (; endingId > openingRewardId && closingId > openingRewardId; openingRewardId++) {
           
            if (rewardInfo[openingRewardId].timestamp == 0) break;
            rewardAmount += _calculateRewards(openingRewardId, _stakeId, incrementedAmount);

            if (_stakeData.rewardIdToIncrementedAmount[openingRewardId] > 0)
                incrementedAmount = _stakeData.rewardIdToIncrementedAmount[openingRewardId];
        }


    }

    function _calculateRewards(uint rewardId, uint _stakeId, uint incrementedAmount) internal view returns (uint rewards) {
        
        string memory pool = stakeInfo[_stakeId].pool;

        uint amountAtGivenRewardId = stakeInfo[_stakeId].amount - (stakeInfo[_stakeId].totalIncremented - incrementedAmount);

        rewards = (((rewardInfo[rewardId].amount * poolInfo[pool].poolPercentage) * amountAtGivenRewardId) /
                rewardInfo[rewardId].poolToAmountLocked[pool]) / PERCENTAGE_FACTOR;
    }

    

    
    function topUpRewards() public onlyRole(REWARDS_ALLOCATOR_ROLE) whenNotPaused {
       
        uint amount = (ALVA.balanceOf(msg.sender) * vaultWithdrawalPercentage) / PERCENTAGE_FACTOR;

        require(amount >= minimumRewardAmount,"Reward must be at least the minimum amount");

        uint _currentIdRewards = currentIdRewards;
        require(_currentIdRewards < rewardPeriodCount(),"Cannot process before time");

        ALVA.transferFrom(msg.sender, address(this), amount);

        uint _unallocatedRewards = unallocatedRewards;
        amount += _unallocatedRewards;
        _unallocatedRewards = 0;

        rewardInfo[_currentIdRewards].amount = amount;
        rewardInfo[_currentIdRewards].timestamp = startTime + ((_currentIdRewards + 1) * REWARD_PERIOD);

        for (uint i = 0; i < Pools.length; i++) {
            poolInfo[Pools[i]].amountLocked += rewardInfo[_currentIdRewards].poolToNewAmount[Pools[i]];

            if (i != 0) 
                poolInfo[Pools[i]].amountLocked -= rewardInfo[_currentIdRewards].poolToExpiredAmount[Pools[i]];

            rewardInfo[_currentIdRewards].poolToAmountLocked[Pools[i]] = poolInfo[Pools[i]].amountLocked;

            if (poolInfo[Pools[i]].amountLocked == 0) 
                _unallocatedRewards +=(amount * poolInfo[Pools[i]].poolPercentage) /PERCENTAGE_FACTOR;

        }

        unallocatedRewards = _unallocatedRewards;

        emit RewardsAdded(_currentIdRewards, amount);
        rewardInfo[_currentIdRewards].isProcessed = true;
        currentIdRewards++;
    }



    function increaseAmount(uint amount, bool isForever) public whenNotPaused {
        
        uint _stakeId;

        if (isForever) {
            _stakeId = foreverStakeId[msg.sender];
            require(_stakeId != 0, "No active forever lock exists for the user");

        } else {
           
            _stakeId = getActiveLockId(msg.sender);
            require(_stakeId != 0 && stakeInfo[_stakeId].endTime > block.timestamp, "No Active lock exists");
            
            ALVA.transferFrom(msg.sender, address(this), amount);
        }

        _increaseAmount(amount, _stakeId);

        emit StakedAmountIncreased(
            _stakeId,
            stakeInfo[_stakeId].amount,
            stakeInfo[_stakeId].votingPower
        );
    }

    function _increaseAmount(uint amount, uint _stakeId) internal {
        
        require(amount >= minimumStakingAmount, "Amount is below the minimum required");

        string memory poolActiveLock = stakeInfo[_stakeId].pool;
        require(poolInfo[poolActiveLock].status, "Pool is currently disabled");

        // Finalize pending rewards before increasing stake
        if (stakeInfo[_stakeId].isForever) {
            _finalizeForeverLockRewards();
        } else {
            _finalizeTimeBaseRewards(_stakeId);
        }

        uint veALVANew = getveAlvaAmount(amount, poolActiveLock);
        veALVA.mint(msg.sender, veALVANew);

        stakeInfo[_stakeId].amount += amount;
        stakeInfo[_stakeId].votingPower += veALVANew;
        stakeInfo[_stakeId].totalIncremented += amount;

        uint _currentRewardPeriod = rewardPeriodCount();
        uint closingRewardId = stakeInfo[_stakeId].closingRewardId;

        // Update openingRewardId to current period to ensure immediate reward reflection
        stakeInfo[_stakeId].openingRewardId = _currentRewardPeriod;

        // Update reward data for current and closing periods
        if (closingRewardId >= _currentRewardPeriod || stakeInfo[_stakeId].isForever) {
            rewardInfo[_currentRewardPeriod].poolToNewAmount[poolActiveLock] += amount;
            rewardInfo[closingRewardId].poolToExpiredAmount[poolActiveLock] += amount;
            // Update poolToAmountLocked to reflect the incremented amount immediately
            if (rewardInfo[_currentRewardPeriod].isProcessed) {
                rewardInfo[_currentRewardPeriod].poolToAmountLocked[poolActiveLock] += amount;
            }
        }

        // Store total incremented amount for the current reward period
        stakeInfo[_stakeId].rewardIdToIncrementedAmount[_currentRewardPeriod] = stakeInfo[_stakeId].totalIncremented;
    }

    function renewStaking(uint amount, string memory pool) public whenNotPaused {
        
        uint activeLock = getActiveLockId(msg.sender);

        require(activeLock != 0 && stakeInfo[activeLock].endTime > block.timestamp, "No active lock found");
        require(poolInfo[pool].duration >= stakeInfo[activeLock].duration, "Lock duration cannot be less than existing lock");

        uint previousAmount = stakeInfo[activeLock].amount;
        string memory poolActiveLock = stakeInfo[activeLock].pool;

        stakeInfo[activeLock].isActive = false;
        stakeInfo[activeLock].endTime = block.timestamp;

        uint _rewardPeriodCount = rewardPeriodCount();

        if (stakeInfo[activeLock].closingRewardId > _rewardPeriodCount) {
            rewardInfo[stakeInfo[activeLock].closingRewardId].poolToExpiredAmount[poolActiveLock] -= previousAmount;
            stakeInfo[activeLock].closingRewardId = _rewardPeriodCount;
            rewardInfo[_rewardPeriodCount].poolToExpiredAmount[poolActiveLock] += previousAmount;

            if (stakeInfo[activeLock].openingRewardId == stakeInfo[activeLock].closingRewardId &&
                rewardEligibleIds[msg.sender].length > 0) {
                rewardEligibleIds[msg.sender].pop();
            }
        }

        _stake(
            amount,
            previousAmount,
            stakeInfo[activeLock].votingPower,
            pool,
            _rewardPeriodCount
        );

        emit LockRenewed(activeLock, stakeId);
    }

    function unstake() public whenNotPaused {
        uint activeLock = getActiveLockId(msg.sender);
        require(activeLock != 0, "No active lock found");
        require(block.timestamp > stakeInfo[activeLock].endTime, "Cannot unstake before the lock end time");

        ALVA.transfer(msg.sender, stakeInfo[activeLock].amount);
        veALVA.burnTokens(msg.sender, stakeInfo[activeLock].votingPower);
        stakeInfo[activeLock].isActive = false;

        emit Withdrawn(
            msg.sender,
            activeLock,
            stakeInfo[activeLock].endTime
        );
    }

    

    function compoundRewards(bool isForever) public whenNotPaused {
        uint reward = _claimRewards();

        uint _stakeId;
        if (isForever) {
            _stakeId = foreverStakeId[msg.sender];
            require(_stakeId != 0, "No active forever lock exists for the user");
            ALVA.burn(reward);
        } else {
            _stakeId = getActiveLockId(msg.sender);
            require(
                _stakeId != 0 &&
                    stakeInfo[_stakeId].endTime > block.timestamp,
                "No Active lock exists"
            );
        }

        _increaseAmount(reward, _stakeId);

        emit Compounded(
            _stakeId,
            stakeInfo[_stakeId].amount,
            reward,
            stakeInfo[_stakeId].votingPower
        );
    }



    function updateMinimumRewardAmount(uint amount) public onlyRole(ADMIN_ROLE) {
        minimumRewardAmount = amount;
    }

    function updatePoolStatus(string memory pool, bool status) public onlyRole(ADMIN_ROLE) {
        
        bool exists = false;
        
        uint length = Pools.length;
        
        for (uint256 i = 0; i < length; i++) {
           
            if (keccak256(abi.encodePacked(Pools[i])) == keccak256(abi.encodePacked(pool))) {
                exists = true;
                break;
            }
        }
        require(exists, "Pool does not exist");

        poolInfo[pool].status = status;
    }

    function updateMinStakingAmount(uint amount) public onlyRole(ADMIN_ROLE) {
        require(amount >= 1, "Minimum amount must be at least 1");
        minimumStakingAmount = amount;
    }

    function updateWithdrawalPercentage(uint amount) public onlyRole(ADMIN_ROLE) {
        require(amount <= PERCENTAGE_FACTOR, "Invalid percentage value");
        vaultWithdrawalPercentage = amount;
    }

    function updateDecayInterval(uint newInterval) public onlyRole(ADMIN_ROLE) {
        require(newInterval > 0 && newInterval <= 1 weeks, "Interval should be within the valid range");
        decayInterval = newInterval;
    }

    function getRewardsPending(address account) public view returns (uint totalReward) {
        uint timebaseReward;
        uint foreverLockReward;
        uint currentIndex = claimedRewardId[account];

        for (currentIndex; currentIndex < rewardEligibleIds[account].length; currentIndex++) {
            (uint reward, , ) = countRewards(
                rewardEligibleIds[account][currentIndex],
                stakeInfo[rewardEligibleIds[account][currentIndex]].closingRewardId -
                    stakeInfo[rewardEligibleIds[account][currentIndex]].openingRewardId
            );
            timebaseReward += reward;
        }

        if (
            foreverStakeId[account] > 0 &&
            currentIdRewards > stakeInfo[foreverStakeId[account]].openingRewardId
        ) {
            (foreverLockReward, , ) = countRewards(
                foreverStakeId[account],
                currentIdRewards - stakeInfo[foreverStakeId[account]].openingRewardId
            );
        }

        totalReward = timebaseReward + foreverLockReward + userReward[account];
    }

    function veAlvaBalance(address account) external view returns (uint) {
        uint activeLock = getActiveLockId(account);
        uint balance = stakeInfo[activeLock].votingPower;

        if (stakeInfo[activeLock].startTime > 0) {
            uint intervalsPassed = (block.timestamp - stakeInfo[activeLock].startTime) / decayInterval;
            uint totalIntervals = stakeInfo[activeLock].duration / decayInterval;
            if (totalIntervals > intervalsPassed) {
                balance = (balance * (totalIntervals - intervalsPassed)) / totalIntervals;
            } else {
                balance = 0;
            }
        }

        return balance + stakeInfo[foreverStakeId[account]].votingPower;
    }

    function getIncrementedAmount(uint _stakeId, uint rewardId) external view returns (uint amount) {
        amount = stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId];
    }

    function getPoolDataByRewardId(uint rewardId, string memory pool) external view returns (
        uint poolToAmountLocked,
        uint poolToNewAmount,
        uint poolToExpiredAmount
    ) {
        return (
            rewardInfo[rewardId].poolToAmountLocked[pool],
            rewardInfo[rewardId].poolToNewAmount[pool],
            rewardInfo[rewardId].poolToExpiredAmount[pool]
        );
    }

    function getTotalLocks(address account) external view returns (uint userLocksTotal, uint userRewardEligibleLocks) {
        userLocksTotal = rewardEligibleIds[account].length;
        userRewardEligibleLocks = userStakeIds[account].length;
    }

    function rewardPeriodCount() public view returns (uint) {
        return (block.timestamp - startTime) / REWARD_PERIOD;
    }

    function getveAlvaAmount(uint amount, string memory pool) public view returns (uint) {
        return (amount * poolInfo[pool].veAlvaRatio) / RATIO_FACTOR;
    }

    function getActiveLockId(address account) public view returns (uint timebaseId) {
        uint locksLength = userStakeIds[account].length;
        if (locksLength > 0) {
            if (stakeInfo[userStakeIds[account][locksLength - 1]].isActive) {
                timebaseId = userStakeIds[account][locksLength - 1];
            }
        }
    }
}



/// @notice Admin-only function to retroactively correct rewards for a user’s locks by updating poolToAmountLocked and recalculating rewards.
    // /// @dev Updates poolToAmountLocked for past periods where increments occurred, recalculates rewards, and advances openingRewardId.
    // function correctRewards(address account) public onlyRole(ADMIN_ROLE) {
    //     uint rewardAmount;

    //     uint currentIndex = claimedRewardId[account];
    //     for (currentIndex; currentIndex < rewardEligibleIds[account].length; currentIndex++) {
    //         uint _stakeId = rewardEligibleIds[account][currentIndex];
    //         if (stakeInfo[_stakeId].openingRewardId < stakeInfo[_stakeId].closingRewardId) {
    //             uint incrementedAmount = stakeInfo[_stakeId].rewardIdToIncrementedAmount[stakeInfo[_stakeId].openingRewardId];
    //             for (uint rewardId = stakeInfo[_stakeId].openingRewardId; rewardId < stakeInfo[_stakeId].closingRewardId; rewardId++) {
    //                 if (rewardInfo[rewardId].isProcessed) {
    //                     string memory pool = stakeInfo[_stakeId].pool;
    //                     if (stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId] > incrementedAmount) {
    //                         uint increment = stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId] - incrementedAmount;
    //                         rewardInfo[rewardId].poolToAmountLocked[pool] += increment;
    //                         incrementedAmount = stakeInfo[_stakeId].rewardIdToIncrementedAmount[rewardId];
    //                     }
    //                     rewardAmount += _calculateRewards(rewardId, _stakeId, incrementedAmount);
    //                 }
    //             }

    //             stakeInfo[_stakeId].rewardsCurrent += rewardAmount;
    //             userReward[account] += rewardAmount;
    //             stakeInfo[_stakeId].openingRewardId = stakeInfo[_stakeId].closingRewardId;
    //             claimedRewardId[account]++;
    //         }
    //     }

    //     uint foreverLockId = foreverStakeId[account];
    //     if (foreverLockId != 0 && stakeInfo[foreverLockId].openingRewardId < currentIdRewards) {
    //         uint incrementedAmount = stakeInfo[foreverLockId].rewardIdToIncrementedAmount[stakeInfo[foreverLockId].openingRewardId];
    //         for (uint rewardId = stakeInfo[foreverLockId].openingRewardId; rewardId < currentIdRewards; rewardId++) {
    //             if (rewardInfo[rewardId].isProcessed) {
    //                 string memory pool = stakeInfo[foreverLockId].pool;
    //                 if (stakeInfo[foreverLockId].rewardIdToIncrementedAmount[rewardId] > incrementedAmount) {
    //                     uint increment = stakeInfo[foreverLockId].rewardIdToIncrementedAmount[rewardId] - incrementedAmount;
    //                     rewardInfo[rewardId].poolToAmountLocked[pool] += increment;
    //                     incrementedAmount = stakeInfo[foreverLockId].rewardIdToIncrementedAmount[rewardId];
    //                 }
    //                 rewardAmount += _calculateRewards(rewardId, foreverLockId, incrementedAmount);
    //             }
    //         }
    //         stakeInfo[foreverLockId].rewardsCurrent += rewardAmount;
    //         userReward[account] += rewardAmount;
    //         stakeInfo[foreverLockId].openingRewardId = currentIdRewards;
    //     }

    //     if (rewardAmount > 0) {
    //         emit RewardsCorrected(account, rewardAmount);
    //     }
    // }
