// abis/MErc20.ts

export const MErc20Abi = [
  {
    "type": "function",
    "name": "totalBorrows",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "getCash",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "totalReserves",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "reserveFactorMantissa",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }]
  }
] as const; 