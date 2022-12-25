import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

const MAX_TOKEN_SUPPLY = '100000000000' // 100 billion
const MAXIMUM_LAMPORTS_FOR_AUTHORITY = BigNumber(LAMPORTS_PER_SOL) // 1 SOL

const MAX_ACTIVE_LOANS = 3 // user can only have 3 active loans at a time
const MAX_PERCENT_OF_SUPPLY_IN_LOAN = 0.025 // 2.5%

export {
    MAXIMUM_LAMPORTS_FOR_AUTHORITY,
    MAX_TOKEN_SUPPLY,
    MAX_ACTIVE_LOANS,
    MAX_PERCENT_OF_SUPPLY_IN_LOAN,
}
