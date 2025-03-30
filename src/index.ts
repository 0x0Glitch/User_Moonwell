// index.ts
import { ponder } from "ponder:registry"; // or "ponder:registry" if your setup requires
import { userAddresses, userPositions } from "../ponder.schema";
import { createPublicClient, http, defineChain } from "viem";

// --------------------------------------------------------------------------
// 1) Import your ABIs
// --------------------------------------------------------------------------
import { MTokenAbi } from "../abis/MToken"; // (this is the ABI you provided)
import { ComptrollerAbi } from "../abis/Comptroller"; // if you need it
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// 2) Chain & Contract Setup
// --------------------------------------------------------------------------
const baseChain = defineChain({
  id: 8453, // for Base mainnet
  name: "Base",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.PONDER_RPC_URL_8453 || "https://mainnet.base.org"],
    },
    public: {
      http: ["https://mainnet.base.org"],
    },
  },
});

// MToken contract address
const M_TOKEN_ETH_ADDRESS = "0x628ff693426583D9a7FB391E54366292F509D457";

// Optional: Comptroller address (only needed if you want to do more advanced calculations)
const COMPTROLLER_ADDRESS = "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C";

// Create a viem client
const directClient = createPublicClient({
  chain: baseChain,
  transport: http(process.env.PONDER_RPC_URL_8453 || "https://mainnet.base.org"),
});

// --------------------------------------------------------------------------
// 3) Helper: Insert user address (ignore duplicates)
// --------------------------------------------------------------------------
async function insertUserAddress(db: any, address: `0x${string}`) {
  // Insert ignoring duplicates by using onConflict or a "WHERE not exists" style
  await db
    .insert(userAddresses)
    .values({
      userAddress: address,
    })
    .onConflictDoNothing();
}

// --------------------------------------------------------------------------
// 4) Listen to events from the MToken contract
//    We'll show all major events, though you might disable some if you want.
//    For each event, we pick out any addresses involved and insert them
//    into user_addresses.
// --------------------------------------------------------------------------

/** 4.1) Borrow Event */
ponder.on("MToken:Borrow", async ({ event, context }) => {
  try {
    const { db } = context;
    const { borrower } = event.args as {
      borrower: `0x${string}`;
      borrowAmount: bigint;
      accountBorrows: bigint;
      totalBorrows: bigint;
    };

    // Insert borrower into user_addresses table
    await insertUserAddress(db, borrower);
  } catch (err) {
    console.error("Error in Borrow handler:", err);
  }
});

/** 4.2) RepayBorrow Event */
ponder.on("MToken:RepayBorrow", async ({ event, context }) => {
  try {
    const { db } = context;
    const { payer, borrower } = event.args as {
      payer: `0x${string}`;
      borrower: `0x${string}`;
      repayAmount: bigint;
      accountBorrows: bigint;
      totalBorrows: bigint;
    };

    await insertUserAddress(db, borrower);
    // The payer might also be a user
    if (payer !== borrower) {
      await insertUserAddress(db, payer);
    }
  } catch (err) {
    console.error("Error in RepayBorrow handler:", err);
  }
});

/** 4.3) Mint Event (Supply) */
ponder.on("MToken:Mint", async ({ event, context }) => {
  try {
    const { db } = context;
    const { minter } = event.args as {
      minter: `0x${string}`;
      mintAmount: bigint;
      mintTokens: bigint;
    };

    await insertUserAddress(db, minter);
  } catch (err) {
    console.error("Error in Mint handler:", err);
  }
});

/** 4.4) Redeem Event (Withdraw) */
ponder.on("MToken:Redeem", async ({ event, context }) => {
  try {
    const { db } = context;
    const { redeemer } = event.args as {
      redeemer: `0x${string}`;
      redeemAmount: bigint;
      redeemTokens: bigint;
    };

    await insertUserAddress(db, redeemer);
  } catch (err) {
    console.error("Error in Redeem handler:", err);
  }
});

/** 4.5) LiquidateBorrow Event */
ponder.on("MToken:LiquidateBorrow", async ({ event, context }) => {
  try {
    const { db } = context;
    const { liquidator, borrower } = event.args as {
      liquidator: `0x${string}`;
      borrower: `0x${string}`;
      repayAmount: bigint;
      mTokenCollateral: `0x${string}`;
      seizeTokens: bigint;
    };

    await insertUserAddress(db, liquidator);
    await insertUserAddress(db, borrower);
  } catch (err) {
    console.error("Error in LiquidateBorrow handler:", err);
  }
});

/** 4.6) Transfer Event */
ponder.on("MToken:Transfer", async ({ event, context }) => {
  try {
    const { db } = context;
    const { from, to } = event.args as {
      from: `0x${string}`;
      to: `0x${string}`;
      amount: bigint;
    };

    await insertUserAddress(db, from);
    await insertUserAddress(db, to);
  } catch (err) {
    console.error("Error in Transfer handler:", err);
  }
});

/** 4.7) Approval Event */
ponder.on("MToken:Approval", async ({ event, context }) => {
  try {
    const { db } = context;
    const { owner, spender } = event.args as {
      owner: `0x${string}`;
      spender: `0x${string}`;
      amount: bigint;
    };

    await insertUserAddress(db, owner);
    await insertUserAddress(db, spender);
  } catch (err) {
    console.error("Error in Approval handler:", err);
  }
});

/**
 * If you want to handle other events like AccrueInterest, just do it similarly:
 *   ponder.on("MToken:AccrueInterest", async ({ event, context }) => { ... });
 * But since it doesn't directly yield user addresses, you could skip it.
 */

// --------------------------------------------------------------------------
// 5) Every 10 blocks, gather addresses and update user_positions
// --------------------------------------------------------------------------
ponder.on("Newblocks:block", async ({ event, context }) => {
  const { db } = context;
  
  // We only run this every 10 blocks
  if (event.block.number % 10n !== 0n) {
    return;
  }

  console.log(`Block ${event.block.number}: Updating user positions...`);

  // 1) Fetch all user addresses from the user_addresses table
  const allUsers = await db
    .sql
    .select()
    .from(userAddresses);

  // 2) For each user, read supply & borrow from the MToken contract
  for (const row of allUsers) {
    const address = row.userAddress as `0x${string}`;

    let amountSupplied: bigint;
    let amountBorrowed: bigint;

    try {
      // balanceOf(address) -> returns supply in token terms
      amountSupplied = await directClient.readContract({
        abi: MTokenAbi,
        address: M_TOKEN_ETH_ADDRESS,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
    } catch {
      amountSupplied = 0n;
    }

    try {
      // borrowBalanceStored(address) -> returns the borrow
      amountBorrowed = await directClient.readContract({
        abi: MTokenAbi,
        address: M_TOKEN_ETH_ADDRESS,
        functionName: "borrowBalanceStored",
        args: [address],
      }) as bigint;
    } catch {
      amountBorrowed = 0n;
    }

    // 3) Compute a simple health factor = supply / borrow
    //    If you want a fallback for borrow=0 => HF=999999, do so:
    let healthFactor: number;
    if (amountBorrowed === 0n) {
      healthFactor = 999999;
    } else {
      healthFactor = Number(amountSupplied) / Number(amountBorrowed);
    }

    // 4) Upsert into user_positions
    await db
      .insert(userPositions)
      .values({
        userAddress: address,
        amountSupplied,
        amountBorrowed,
        healthFactor: healthFactor,
      })
      .onConflictDoUpdate(() => ({
        amountSupplied,
        amountBorrowed,
        healthFactor: healthFactor,
      }));
  }

  console.log(
    `Block ${event.block.number}: Finished updating positions for ${allUsers.length} addresses.`)
});
