// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

/// @title Roulette Game
/// @notice Simple roulette game using ERC20 tokens as currency
/// @dev Uses SafeERC20 and ReentrancyGuard for security
contract Roulette is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice ERC20 token used for betting
    IERC20 public immutable token;

    /// @notice Multipliers for each sector
    uint256[] public sectorMultipliers;

    /// @notice Event emitted after a spin
    event SpinResult(
        address indexed player,
        uint256 sectorIndex,
        uint256 multiplier,
        uint256 payout
    );

    /// @notice Constructor initializes the token and sector multipliers
    /// @param tokenAddress Address of the ERC20 token
    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);

        // 0x x10
        for (uint i = 0; i < 10; i++) sectorMultipliers.push(0);
        // 1x x4
        for (uint i = 0; i < 4; i++) sectorMultipliers.push(1);
        // 2x x3
        for (uint i = 0; i < 3; i++) sectorMultipliers.push(2);
        // 4x x2
        for (uint i = 0; i < 2; i++) sectorMultipliers.push(4);
        // 8x x1
        sectorMultipliers.push(8);
    }

    /// @notice Allows a user to spin the roulette by betting tokens
    /// @param betAmount Amount of tokens to bet
    function spin(uint256 betAmount) external nonReentrant {
        require(betAmount > 0, "Invalid bet");

        // Transfer tokens from player to contract
        token.safeTransferFrom(msg.sender, address(this), betAmount);

        // Generate pseudo-random index
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        );

        uint256 index = rand % sectorMultipliers.length;
        uint256 multiplier = sectorMultipliers[index];
        uint256 payout = betAmount * multiplier;

        // Pay out winnings if any
        if (payout > 0) {
            require(
                token.balanceOf(address(this)) >= payout,
                "Contract has insufficient tokens"
            );
            token.safeTransfer(msg.sender, payout);
        }

        // 🔹 Console log for debugging
        console.log("=== SPIN DEBUG ===");
        console.log("Player:", msg.sender);
        console.log("Random index:", index);
        console.log("Multiplier:", multiplier);
        console.log("Payout:", payout);

        emit SpinResult(msg.sender, index, multiplier, payout);
    }

    /// @notice Returns the total number of sectors
    function sectorsCount() external view returns (uint256) {
        return sectorMultipliers.length;
    }
}
