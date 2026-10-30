// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract UniKinToken is ERC20, ERC20Capped, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18;

    constructor(address initialAdmin)
        ERC20("UniKin Token", "UKT")
        ERC20Capped(MAX_SUPPLY)
    {
        require(initialAdmin != address(0), "Adresse admin invalide");

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);

        _mint(initialAdmin, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
