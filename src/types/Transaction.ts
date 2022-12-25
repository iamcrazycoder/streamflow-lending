import { Loan, Tx } from '@prisma/client'
import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

interface TransferTokenArgs {
    amount: BigNumber
    loanId: number
    mintAddress: PublicKey
    to: PublicKey
}

type txId = string

type TransferTokenResponse = Pick<Tx, 'id' | 'txId'>

export { TransferTokenArgs, TransferTokenResponse }
