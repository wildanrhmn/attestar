pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

// A single holder leaf in the Merkle-sum tree.
// hash = Poseidon(userId, balance), sum = balance.
// Num2Bits(BITS) constrains balance to [0, 2^BITS), which both bounds it and
// guarantees non-negativity. The negative-balance attack (an issuer hiding
// liabilities behind negative leaves) is impossible because every leaf is range
// checked here.
template Leaf(BITS) {
    signal input balance;
    signal input userId;
    signal output hash;
    signal output sum;

    component range = Num2Bits(BITS);
    range.in <== balance;

    component h = Poseidon(2);
    h.inputs[0] <== userId;
    h.inputs[1] <== balance;

    hash <== h.out;
    sum <== balance;
}

// An internal node combining two children, carrying both a binding hash and the
// running subtree sum.
// hash = Poseidon(leftHash, leftSum, rightHash, rightSum)
// sum  = leftSum + rightSum
template Node() {
    signal input leftHash;
    signal input leftSum;
    signal input rightHash;
    signal input rightSum;
    signal output hash;
    signal output sum;

    component h = Poseidon(4);
    h.inputs[0] <== leftHash;
    h.inputs[1] <== leftSum;
    h.inputs[2] <== rightHash;
    h.inputs[3] <== rightSum;

    hash <== h.out;
    sum <== leftSum + rightSum;
}

// Proves that `root` is the Merkle-sum root of N = 2^DEPTH leaves and that
// `total` equals the sum of all (range checked, non-negative) balances.
//
// Public outputs: root, total.
// Private inputs: balances[N], userIds[N].
//
// The contract that consumes this proof compares `total` (liabilities) against
// the issuer's reserves. Completeness (no holder omitted) is enforced socially:
// each holder verifies a Merkle inclusion path against the published root.
template SolvencyTree(DEPTH, BITS) {
    var N = 1 << DEPTH;

    signal input balances[N];
    signal input userIds[N];

    signal output root;
    signal output total;

    component leaf[N];
    signal levelHash[DEPTH + 1][N];
    signal levelSum[DEPTH + 1][N];

    for (var i = 0; i < N; i++) {
        leaf[i] = Leaf(BITS);
        leaf[i].balance <== balances[i];
        leaf[i].userId <== userIds[i];
        levelHash[0][i] <== leaf[i].hash;
        levelSum[0][i] <== leaf[i].sum;
    }

    component node[DEPTH][N / 2];
    for (var d = 0; d < DEPTH; d++) {
        var width = N >> (d + 1);
        for (var i = 0; i < width; i++) {
            node[d][i] = Node();
            node[d][i].leftHash  <== levelHash[d][2 * i];
            node[d][i].leftSum   <== levelSum[d][2 * i];
            node[d][i].rightHash <== levelHash[d][2 * i + 1];
            node[d][i].rightSum  <== levelSum[d][2 * i + 1];
            levelHash[d + 1][i] <== node[d][i].hash;
            levelSum[d + 1][i]  <== node[d][i].sum;
        }
    }

    root  <== levelHash[DEPTH][0];
    total <== levelSum[DEPTH][0];
}
