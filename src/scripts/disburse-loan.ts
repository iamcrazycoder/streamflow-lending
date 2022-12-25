import { PublicKey } from '@solana/web3.js'
import Lend from '../models/Lend'
import { decodeStringToKeyPair, getBN } from '../utils'

/**
 * Script to disburse loan to a users wallet.
 * Alternatively, a loan can also be disbursed via REST API /lend/request-loan
 *
 * Run this script: yarn disburse-loan
 */
;(async () => {
    const userWallet = decodeStringToKeyPair(process.env.USER_SECRET as string)
    const lend = new Lend(userWallet.publicKey)

    await lend.disburseLoan({
        amount: getBN(100, 9), // 100 tokens and 9 decimals
        mintAddress: new PublicKey('<token-public-key>'), // run `yarn setup-token` to create token
    })
})()
