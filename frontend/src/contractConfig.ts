export const CONTRACT_ADDRESSES = {
  token: "0x8730872b7db6B94B37ad58AA6EA4ED0C1b2C74e0",
  roulette: "0x92F535a29AA7CD7AB37a125264aF1220F8155ABd",
};

export const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const ROULETTE_ABI = [
  "function spin(uint256 betAmount) external",
  "function sectorsCount() view returns (uint256)",
  "event SpinResult(address indexed player, uint256 sectorIndex)"
];
