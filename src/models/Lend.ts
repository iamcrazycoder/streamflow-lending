import { Loan } from '@prisma/client'
import { getMint } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import prisma from '../../prisma'
import connection from '../config/solana-connection'
import { MAX_ACTIVE_LOANS, MAX_PERCENT_OF_SUPPLY_IN_LOAN } from '../constants'
import errors from '../constants/errors'
import {
    CheckOutstandingAmountArgs,
    DisburseLoanArgs,
    DisburseLoanResponse,
    GenerateLoanDataArgs,
    GetOutstandingLoansArgs,
    GetTotalOutstandingAmountArgs,
    IsUserEligibleArgs,
    RelativeLoanData,
} from '../types'
import {
    getBigIntFromBN,
    getNumberFromBN,
    getPercentOfMaxSupply,
} from '../utils'
import Authority from './Authority'
import TokenManager from './TokenManager'
import Transaction from './Transaction'

/**
 * Lend class to manage loans, check user elgibility and retrieve loan data
 * Accepts users public key in constructor
 */
class Lend extends TokenManager {
    userAddress: PublicKey
    constructor(userAddress: PublicKey | string) {
        super()

        this.userAddress =
            typeof userAddress === 'string'
                ? new PublicKey(userAddress)
                : userAddress
    }

    /**
     * Disburses loan to user provider wallet
     * Side-effects:
     *  1. May create ATA for token if it doesn't exist
     *  2. Tx fee is paid by the authority
     *
     * @returns off chain tx id, on-chain tx id, and loan id
     */
    async disburseLoan({
        amount,
        mintAddress,
    }: DisburseLoanArgs): Promise<DisburseLoanResponse> {
        await this.isUserEligible({
            mintAddress,
            amount,
        })

        if (amount.isZero() || amount.isNegative()) {
            throw new Error(errors.INVALID_AMOUNT)
        }

        const [userTokenATA, loan] = await Promise.all([
            this.createUserTokenATA({
                mintAddress,
                userAddress: this.userAddress,
            }),
            this.generateLoanData({
                mintAddress,
                amount,
            }),
        ])

        const tx = new Transaction()
        const txResponse = await tx.transferToken({
            amount,
            loanId: loan.id,
            mintAddress,
            to: userTokenATA.address,
        })

        return { ...txResponse, loanId: loan.id }
    }

    /**
     * Checks if user is valid and eligible for loan
     * Throws error on falsy scenarios, returns nothing
     */
    private async isUserEligible({
        mintAddress,
        amount,
    }: IsUserEligibleArgs): Promise<void> {
        const [loans, tokenInfo] = await Promise.all([
            this.getOutstandingLoans({ mintAddress }) as Promise<Loan[]>,
            getMint(connection, mintAddress),
        ])

        // check if user is authority
        if (this.validateAuthority(this.userAddress, true)) {
            throw new Error(errors.AUTHORITY_LOAN)
        }

        await this.checkActiveLoans({ loans, tokenInfo, amount })
    }

    /**
     * Checks if user has any active loans.
     * Throws if user already has maximum allowed active loans
     */
    private async checkActiveLoans({
        loans,
        tokenInfo,
        amount,
    }: CheckOutstandingAmountArgs): Promise<void> {
        if (loans.length === MAX_ACTIVE_LOANS) {
            throw new Error(errors.MAX_ACTIVE_LOANS)
        }

        await this.checkOutstandingAmount({ loans, tokenInfo, amount })
    }

    /**
     * Checks whether the current outstanding + new loan amount
     * is above a defined % of the total supply of token
     * Throws if the above is true.
     */
    private async checkOutstandingAmount({
        loans,
        tokenInfo,
        amount,
    }: CheckOutstandingAmountArgs): Promise<void> {
        const outstandingAmount = await this.getTotalOutstandingAmount({
            loans,
            mintAddress: tokenInfo.address,
        })
        const percOfMaxSupply = getPercentOfMaxSupply(
            outstandingAmount.plus(amount),
            tokenInfo.decimals,
            tokenInfo.supply.toString()
        )

        if (percOfMaxSupply > MAX_PERCENT_OF_SUPPLY_IN_LOAN) {
            throw new Error(errors.MAX_LOAN_SUPPLIED)
        }
    }

    /**
     * Saves loan data in the database
     * @returns newly created loan data
     */
    private async generateLoanData({
        mintAddress,
        amount,
    }: GenerateLoanDataArgs) {
        const loan = await prisma.loan.create({
            data: {
                amount: getBigIntFromBN(amount),
                user: {
                    connectOrCreate: {
                        where: {
                            walletAddress: this.userAddress.toBase58(),
                        },
                        create: {
                            walletAddress: this.userAddress.toBase58(),
                        },
                    },
                },
                token: {
                    connect: {
                        address: mintAddress.toBase58(),
                    },
                },
            },
        })

        return loan
    }

    /**
     * @returns total/consolidated outstanding amount by user for a token
     */
    async getTotalOutstandingAmount({
        loans = [],
        mintAddress,
    }: GetTotalOutstandingAmountArgs): Promise<BigNumber> {
        loans = loans.length
            ? loans
            : ((await this.getOutstandingLoans({ mintAddress })) as Loan[])

        return loans.reduce(
            (total, { amount }) => total.plus(amount.toString()),
            new BigNumber(0)
        )
    }

    /**
     * @returns outstanding loans of user.
     * Pass `{returnReadable: true}` in 1st arg to return readable data
     */
    async getOutstandingLoans({
        returnReadable = false,
        mintAddress,
    }: GetOutstandingLoansArgs = {}) {
        const loans = await prisma.loan.findMany({
            select: {
                token: true,
                user: true,
                txs: true,
                id: true,
                tokenId: true,
                userId: true,
                amount: true,
                createdAt: true,
                updatedAt: true,
            },
            where: {
                user: {
                    walletAddress: this.userAddress.toBase58(),
                },
                token: mintAddress
                    ? {
                          address: mintAddress && mintAddress.toBase58(),
                      }
                    : undefined,
            },
        })

        return returnReadable ? generateReadableLoanData(loans) : loans
    }

    // Authority controlled methods

    /**
     * Used by authority to retrieve all outstanding user loans
     * @param authorityPublicKey
     * @returns
     */
    static async getAllOutstandingLoans(authorityPublicKey: PublicKey) {
        const authority = new Authority()
        authority.validateAuthority(authorityPublicKey)

        const loans = await prisma.loan.findMany({
            select: {
                token: true,
                user: true,
                txs: true,
                id: true,
                tokenId: true,
                userId: true,
                amount: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return generateReadableLoanData(loans)
    }
}

// Formatting function to return readable data
function generateReadableLoanData(loans: RelativeLoanData[]) {
    return loans.map((loan) => {
        return {
            loanId: loan.id,
            tokenAddress: loan.token.address,
            tokenName: loan.token.name,
            userAddress: loan.user.walletAddress,
            txId: loan.txs.find((tx) => tx.loanId === loan.id)?.txId,
            amount: getNumberFromBN(
                new BigNumber(loan.amount.toString()),
                loan.token.decimals
            ),
            timestamp: loan.createdAt,
        }
    })
}

export default Lend
