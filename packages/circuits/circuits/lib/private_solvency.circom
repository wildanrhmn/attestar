pragma circom 2.1.6;

include "solvency_tree.circom";
include "circomlib/circuits/comparators.circom";

// Private proof of solvency over two hidden vectors.
//
// Liabilities (holder balances) and off-chain reserve sources are both committed
// as Merkle-sum trees; neither composition nor total is revealed. The only public
// reserve figure is `onchainReserves`, which the verifying contract substitutes
// with the issuer's real on-chain token balance, so the prover cannot inflate it.
//
// The circuit computes, in zero knowledge:
//   solvent = (onchainReserves + offchainReserveTotal) >= liabilitiesTotal
// and exposes `solvent` as a public output the contract records. Because `solvent`
// is constrained to the honest comparison over the committed balances (range
// checked, non-negative) and the contract-supplied real on-chain figure, the
// issuer cannot publish a true `solvent = 1` while actually insolvent.
//
// Public signals (in order): liabRoot, resRoot, solvent, onchainReserves.
template PrivateSolvency(LIAB_DEPTH, RES_DEPTH, BITS, CMPBITS) {
    var NL = 1 << LIAB_DEPTH;
    var NR = 1 << RES_DEPTH;

    signal input balances[NL];
    signal input userIds[NL];
    signal input reserves[NR];
    signal input sourceIds[NR];
    signal input onchainReserves;

    signal output liabRoot;
    signal output resRoot;
    signal output solvent;

    component liab = SolvencyTree(LIAB_DEPTH, BITS);
    for (var i = 0; i < NL; i++) {
        liab.balances[i] <== balances[i];
        liab.userIds[i] <== userIds[i];
    }
    liabRoot <== liab.root;

    component res = SolvencyTree(RES_DEPTH, BITS);
    for (var i = 0; i < NR; i++) {
        res.balances[i] <== reserves[i];
        res.userIds[i] <== sourceIds[i];
    }
    resRoot <== res.root;

    signal totalReserves;
    totalReserves <== onchainReserves + res.total;

    component cmp = GreaterEqThan(CMPBITS);
    cmp.in[0] <== totalReserves;
    cmp.in[1] <== liab.total;
    solvent <== cmp.out;
}
