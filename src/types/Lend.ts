import { Loan, Token, Tx, User } from '@prisma/client'
import { Mint } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import { GetTokenInfoResponse } from './TokenManager'
import { TransferTokenResponse } from './Transaction'

interface DisburseLoanArgs {
    amount: BigNumber
    mintAddress: PublicKey
}

type DisburseLoanResponse = TransferTokenResponse & {
    loanId: Loan['id']
}

interface IsUserEligibleArgs {
    mintAddress: PublicKey
    amount: BigNumber
}

interface CheckOutstandingAmountArgs {
    loans: Loan[]
    tokenInfo: GetTokenInfoResponse
    amount: BigNumber
}

interface GenerateLoanDataArgs {
    mintAddress: PublicKey
    amount: BigNumber
}

interface GetTotalOutstandingAmountArgs {
    loans: Loan[]
    mintAddress: PublicKey
}

interface GetOutstandingLoansArgs {
    returnReadable?: boolean
    mintAddress?: PublicKey
}

interface RelativeLoanData extends Loan {
    token: Token
    txs: Tx[]
    user: User
}

export {
    DisburseLoanArgs,
    DisburseLoanResponse,
    IsUserEligibleArgs,
    CheckOutstandingAmountArgs,
    GenerateLoanDataArgs,
    GetTotalOutstandingAmountArgs,
    GetOutstandingLoansArgs,
    RelativeLoanData,
}
