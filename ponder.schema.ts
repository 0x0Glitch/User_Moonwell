// src/schema.ts

import { onchainTable, primaryKey } from "ponder";

export const userAddresses = onchainTable(
  "user_addresses",
  (t) => ({
    // We'll simply store the userAddress as primary key
    userAddress: t.hex().primaryKey(),
  })
);

export const userPositions = onchainTable(
  "user_positions",
  (t) => ({
    // If each user has only one position record, you can use userAddress as the PK
    userAddress: t.hex().primaryKey(),

    // Bigints for amounts, float for health factor
    amountSupplied: t.bigint().notNull(),
    amountBorrowed: t.bigint().notNull(),
    healthFactor: t.real().notNull(),
  })
);
