// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RouletteToken is ERC20, Ownable {
    uint256 public constant PRICE_PER_TOKEN = 0.001 ether;

    constructor() ERC20("Roulette Token", "RLT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function buyTokens(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than 0");
        uint256 requiredETH = PRICE_PER_TOKEN * amount;
        require(msg.value >= requiredETH, "Not enough ETH sent");

        _mint(msg.sender, amount * 10 ** decimals());

        if (msg.value > requiredETH) {
            payable(msg.sender).transfer(msg.value - requiredETH);
        }
    }


    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
