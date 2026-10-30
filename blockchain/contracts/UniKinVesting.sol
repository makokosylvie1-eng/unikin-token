// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/finance/VestingWallet.sol";

contract UniKinVesting is VestingWallet {
    constructor(
        address beneficiary,
        uint64 startTimestamp,
        uint64 durationSeconds
    )
        VestingWallet(
            beneficiary,
            startTimestamp,
            durationSeconds
        )
    {}
}
