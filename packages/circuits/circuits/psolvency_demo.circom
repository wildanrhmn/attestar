pragma circom 2.1.6;

include "lib/private_solvency.circom";

// Demo: up to 16 holders (liabilities) and 8 off-chain reserve sources.
// onchainReserves is public; everything else is private.
component main { public [onchainReserves] } = PrivateSolvency(4, 3, 64, 96);
