import prisma from '../../prisma'
import { TransferTokenArgs, TransferTokenResponse } from '../types'
import Authority from './Authority'
import connection from '../config/solana-connection'
import { PublicKey } from '@solana/web3.js'
import { transfer } from '@solana/spl-token'
import { getBigIntFromBN } from '../utils'
import { TxType } from '@prisma/client'

/**
 * Transaction class to manage transfer of tokens and off-chain records of txs
 */
class Transaction extends Authority {
    constructor() {
        super()
    }

    /**
     * Transfers sanctioned loan tokens from authority's ATA to users ATA.
     *
     * @returns off-chain tx id, on-chain tx id
     */
    async transferToken({
        amount,
        loanId,
        mintAddress,
        to,
    }: TransferTokenArgs): Promise<TransferTokenResponse> {
        const token = await prisma.token.findFirst({
            select: {
                ataAddress: true,
            },
            where: {
                address: mintAddress.toBase58(),
            },
        })

        const [txId, latestBlock] = await Promise.all([
            transfer(
                connection,
                this.owner,
                new PublicKey(token?.ataAddress as string),
                to,
                this.owner,
                getBigIntFromBN(amount)
            ),
            connection.getLatestBlockhash(),
        ])

        const [offchainTx] = await Promise.all([
            prisma.tx.create({
                data: {
                    loanId,
                    mode: TxType.PAYMENT,
                    txId,
                },
            }),
            connection.confirmTransaction({
                ...latestBlock,
                signature: txId,
            }),
        ])

        return { id: offchainTx.id, txId }
    }
}

export default Transaction
