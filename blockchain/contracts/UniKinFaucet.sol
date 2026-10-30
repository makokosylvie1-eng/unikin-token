
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniKinFaucet is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant FAUCET_ADMIN_ROLE =
        keccak256("FAUCET_ADMIN_ROLE");

    IERC20 public immutable token;

    uint256 public amountPerRequest;
    uint256 public cooldown;

    mapping(address => uint256) public lastRequestTime;

    event TokensClaimed(address indexed user, uint256 amount);
    event AmountPerRequestUpdated(uint256 newAmount);
    event CooldownUpdated(uint256 newCooldown);
    event TokensWithdrawn(address indexed recipient, uint256 amount);

    constructor(
        address tokenAddress,
        address initialAdmin,
        uint256 initialAmountPerRequest,
        uint256 initialCooldown
    ) {
        require(tokenAddress != address(0), "Adresse token invalide");
        require(initialAdmin != address(0), "Adresse admin invalide");
        require(initialAmountPerRequest > 0, "Quantite invalide");

        token = IERC20(tokenAddress);
        amountPerRequest = initialAmountPerRequest;
        cooldown = initialCooldown;

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(FAUCET_ADMIN_ROLE, initialAdmin);
    }

    function claim() external {
        require(
            block.timestamp >= lastRequestTime[msg.sender] + cooldown,
            "Veuillez attendre avant une nouvelle demande"
        );

        require(
            token.balanceOf(address(this)) >= amountPerRequest,
            "Faucet vide"
        );

        lastRequestTime[msg.sender] = block.timestamp;

        token.safeTransfer(msg.sender, amountPerRequest);

        emit TokensClaimed(msg.sender, amountPerRequest);
    }

    function setAmountPerRequest(
        uint256 newAmount
    ) external onlyRole(FAUCET_ADMIN_ROLE) {
        require(newAmount > 0, "Quantite invalide");

        amountPerRequest = newAmount;

        emit AmountPerRequestUpdated(newAmount);
    }

    function setCooldown(
        uint256 newCooldown
    ) external onlyRole(FAUCET_ADMIN_ROLE) {
        cooldown = newCooldown;

        emit CooldownUpdated(newCooldown);
    }

    function withdrawTokens(
        address recipient,
        uint256 amount
    ) external onlyRole(FAUCET_ADMIN_ROLE) {
        require(recipient != address(0), "Adresse destinataire invalide");
        require(amount > 0, "Quantite invalide");

        token.safeTransfer(recipient, amount);

        emit TokensWithdrawn(recipient, amount);
    }
}

