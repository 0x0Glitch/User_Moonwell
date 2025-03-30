// abis/Comptroller.ts

// This is a partial example; paste the full JSON from your actual Comptroller ABI below.
// You must `as const` assert so Ponder & TypeScript can treat it as typed.
export const ComptrollerAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "type": "function",
    "name": "oracle",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ]
  },
  // Replacing the existing `markets` function with the one extracted from the above ABI:
  {
    "type": "function",
    "name": "markets",
    "stateMutability": "view",
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "outputs": [
      { "internalType": "bool", "name": "isListed", "type": "bool" },
      { "internalType": "uint256", "name": "collateralFactorMantissa", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "borrowCaps",
    "stateMutability": "view",
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "supplyCaps",
    "stateMutability": "view",
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "liquidationIncentiveMantissa",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ]
  }
] as const;
