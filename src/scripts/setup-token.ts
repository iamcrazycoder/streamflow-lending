import { Keypair } from '@solana/web3.js'
import base58 from 'bs58'
import TokenManager from '../models/TokenManager'
import { init } from '../config'
import { getBN } from '../utils'

init()

const tokenData = {
    decimals: 9,
    name: 'StreamflowX',
    supply: getBN('100000000', 9), // 100 million tokens and 9 decimals
}

const authority = Keypair.fromSecretKey(
    base58.decode(process.env.TOP_AUTHORITY as string)
)

/**
 * Creates a new token
 * Mints initial supply as defined and transfers the supply to an authority owned ATA
 * If ATA doesn't exist, a new one will be created.
 *
 * Prints token, ATA and more data to the console
 */
const setupToken = async () => {
    console.log(`Minting ${tokenData.name} token. This might take a while...`)
    const tokenManager = new TokenManager()
    const response = await tokenManager.setupToken({
        ...tokenData,
        payer: authority.publicKey,
    })

    const output = {
        'Off-chain token ID': response.id,
        'Token mint address': response.mintAddress.toBase58(),
        'ATA holding token supply': response.ataAddress.toBase58(),
        Authority: authority.publicKey.toBase58(),
    }

    console.table(output)
}

;(async () => {
    await setupToken()
})()
