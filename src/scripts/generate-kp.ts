import { Keypair } from '@solana/web3.js'
import { encodeKeyPairToString } from '../utils'

/**
 * Generates keypair. It can be used for authority or user wallets.
 * Copy and paste the output in .env file
 */
;(async () => {
    const kp = Keypair.generate()

    console.log(
        'Set the following to TOP_AUTHORITY in .env file: \n',
        encodeKeyPairToString(kp)
    )
})()
