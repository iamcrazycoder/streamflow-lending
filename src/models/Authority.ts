import { Keypair, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import prisma from '../../prisma'
import connection from '../config/solana-connection'
import { MAXIMUM_LAMPORTS_FOR_AUTHORITY } from '../constants'
import errors from '../constants/errors'
import { decodeStringToKeyPair } from '../utils'

/**
 * Authority is the super-admin of this project.
 * Given the scope of the project, there can only be 1 authority.
 *
 * Define secret key to TOP_AUTHORITY variable in .env file.
 * Run `yarn generate-kp` to create Keypair.
 */
class Authority {
    protected owner: Keypair

    constructor() {
        if (!process.env.TOP_AUTHORITY) {
            throw new Error(errors.DEFINE_AUTHORITY)
        }

        this.owner = decodeStringToKeyPair(process.env.TOP_AUTHORITY)
    }

    /**
     * Requests SOL for authority's wallet to cover the tx fees on the platform
     * This method will halt if authority's wallet already has 1 SOL.
     * Otherwise, it will request for the difference of 1 SOL and current balance
     */
    private async requestSOL(): Promise<void> {
        const balance = BigNumber(
            await connection.getBalance(this.owner.publicKey)
        )
        const lamportsNeeded = MAXIMUM_LAMPORTS_FOR_AUTHORITY.minus(balance)

        if (lamportsNeeded.isNegative() || lamportsNeeded.isZero()) {
            // authority has enough lamports (1 SOL or more)
            return
        }

        const [latestBlock, txId] = await Promise.all([
            connection.getLatestBlockhash(),
            connection.requestAirdrop(
                this.owner.publicKey,
                lamportsNeeded.toNumber()
            ),
        ])

        await connection.confirmTransaction({
            ...latestBlock,
            signature: txId,
        })
    }

    /**
     * Saves authority data to the database
     * @returns {string} Authority public key
     */
    private async saveToDB(): Promise<string> {
        await prisma.authority.upsert({
            where: {
                publicKey: this.owner.publicKey.toBase58(),
            },
            create: {
                publicKey: this.owner.publicKey.toBase58(),
            },
            update: {},
        })

        return this.owner.publicKey.toBase58()
    }

    /**
     * Setup method used in the setup-authority script.
     * @returns [authority public key, null]
     */
    async setup(): Promise<[string, void]> {
        return Promise.all([this.saveToDB(), this.requestSOL()])
    }

    // Returns authority data from the off-chain database
    protected getAuthorityInfo() {
        return prisma.authority.findFirst({
            where: {
                publicKey: this.owner.publicKey.toBase58(),
            },
        })
    }

    // Checks if the given public key belongs to the projects authority
    // Set suppressError (2nd arg) to true otherwise it will throw error on every falsy scenario
    validateAuthority(publicKey: PublicKey, suppressError = false): boolean {
        if (!this.owner.publicKey.equals(publicKey)) {
            if (suppressError) return false

            throw new Error(errors.UNAUTHORIZED)
        }

        return true
    }
}

export default Authority
