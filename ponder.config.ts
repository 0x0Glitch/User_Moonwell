import { createConfig } from "ponder";
import { http } from "viem";

import { ComptrollerAbi } from "./abis/Comptroller";
import { MTokenAbi } from "./abis/MToken";

/**
 * Example addresses - Replace these with actual Moonwell contract addresses
 *   - Comptroller: Contract that manages the protocol
 *   - MToken (e.g. MErc20 ETH): The market token to monitor
 */
const COMPTROLLER_ADDRESS = "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C"; // Moonwell Comptroller on Base
const M_TOKEN_ETH_ADDRESS = "0x628ff693426583D9a7FB391E54366292F509D457"; // mETH (this is just an example, confirm the address)

export default createConfig({
  networks: {
    base: { 
      chainId: 8453, 
      transport: http(process.env.PONDER_RPC_URL_8453 || "https://mainnet.base.org"),
    },
  },
  contracts: {
    Comptroller: {
      abi: ComptrollerAbi,
      network: "base",
      address: COMPTROLLER_ADDRESS,
      startBlock: 28229435, // Moonwell launch block on Base, adjust as needed
    },
    MToken: {
      abi: MTokenAbi,
      network: "base",
      address: M_TOKEN_ETH_ADDRESS,
      startBlock: 28229435, // Moonwell launch block on Base, adjust as needed
    },
  },
  blocks: {
    Newblocks: {
      network: "base",
      startBlock: 28009435, // Same as above
      interval: 10, // run once every 10 blocks
    },
  },
});
