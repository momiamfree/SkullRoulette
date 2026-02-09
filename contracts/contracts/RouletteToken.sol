// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RouletteToken (RLT)
/// @notice ERC20 token used as currency for the Roulette game
/// @dev Includes a buy function to purchase tokens with ETH
contract RouletteToken is ERC20, Ownable {
    /// @notice Price per token in ETH
    uint256 public constant PRICE_PER_TOKEN = 0.001 ether;

    /// @notice Constructor mints initial supply to deployer and sets owner
    constructor() ERC20("Roulette Token", "RLT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /// @notice Allows users to buy tokens by sending ETH
    /// @param amount Number of tokens to buy
    function buyTokens(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than 0");

        uint256 requiredETH = PRICE_PER_TOKEN * amount;
        require(msg.value >= requiredETH, "Not enough ETH sent");

        // Mint the requested amount
        _mint(msg.sender, amount * 10 ** decimals());

        // Refund excess ETH safely
        if (msg.value > requiredETH) {
            (bool sent, ) = msg.sender.call{value: msg.value - requiredETH}("");
            require(sent, "Refund failed");
        }
    }

    /// @notice Allows the owner to withdraw all ETH collected
    function withdrawETH() external onlyOwner {
        (bool sent, ) = payable(owner()).call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }
}
