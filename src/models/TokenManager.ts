import {
    createMint,
    getMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import prisma from '../../prisma'
import connection from '../config/solana-connection'
import { MAX_TOKEN_SUPPLY } from '../constants'
import errors from '../constants/errors'
import {
    CreateUserTokenATAArgs,
    GetTokenInfoResponse,
    MintArgs,
    SetupTokenArgs,
    SetupTokenResponse,
} from '../types'
import {
    getBigIntFromBN,
    getBNFromBigInt,
    isBNGreaterThanMaxSupply,
} from '../utils'
import Authority from './Authority'

/**
 * TokenManager class to manage, setup and mint tokens
 * Also, contains methods to create ATAs for user and authority
 */
class TokenManager extends Authority {
    constructor() {
        super()
    }

    /**
     * Creates a token on-chain
     *
     * @param decimals
     * @returns {PublicKey} Address of newly created token
     */
    private async createToken(decimals: number) {
        const mintAddress = await createMint(
            connection,
            this.owner,
            this.owner.publicKey,
            this.owner.publicKey,
            decimals
        )

        return mintAddress
    }

    /**
     * Creates ATA for a token and assigns ownership to authority
     * to hold the initial supply
     *
     * @param mintAddress {PublicKey} Address of the token to create ATA for.
     * @returns {Account} newly created account details
     */
    private async createAuthorityTokenATA(mintAddress: PublicKey) {
        return getOrCreateAssociatedTokenAccount(
            connection,
            this.owner,
            mintAddress,
            this.owner.publicKey
        )
    }

    /**
     * Creates ATA for users to accept the token in their wallet
     * Authority creates the ATA on behalf of the user and also bears the tx fee.
     *
     * @returns {Account} newly created account details
     */
    protected async createUserTokenATA({
        mintAddress,
        userAddress,
    }: CreateUserTokenATAArgs) {
        return getOrCreateAssociatedTokenAccount(
            connection,
            this.owner,
            mintAddress,
            userAddress
        )
    }

    /**
     * Retrieves off-chain and on-chain token info
     *
     * @param mintAddress
     * @returns combined off-chain and on-chain data of a token
     */
    static async getTokenInfo(
        mintAddress: PublicKey
    ): Promise<GetTokenInfoResponse> {
        const onChainInfo = await getMint(connection, mintAddress)
        const offChainTokenInfo = await prisma.token.findUnique({
            where: {
                address: mintAddress.toBase58(),
            },
        })

        if (!offChainTokenInfo) {
            throw new Error(errors.INVALID_TOKEN_MINT)
        }

        return {
            ...offChainTokenInfo,
            onChainInfo,
        }
    }

    /**
     * Method to setup/create a token. Used in the setup-token script.
     * Please use this method with caution as it creates a new token.
     * Side-effect: tx fee is deducted from authority's wallet
     *
     * @returns off-chain token id, on-chain token address, and
     * ataAddress that holds the initial supply
     */
    async setupToken({
        decimals,
        name,
        payer,
        supply,
    }: SetupTokenArgs): Promise<SetupTokenResponse> {
        this.validateAuthority(payer)

        if (isNaN(decimals) || decimals > 18 || decimals < 0) {
            throw new Error(errors.INVALID_TOKEN_DECIMALS)
        } else if (isBNGreaterThanMaxSupply(supply, decimals)) {
            throw new Error(errors.MAX_SUPPLY)
        }

        const authority = await this.getAuthorityInfo()
        const mintAddress = await this.createToken(decimals)
        const { address: ataAddress } = await this.createAuthorityTokenATA(
            mintAddress
        )

        await this.mint({ mintAddress, ataAddress, amount: supply })

        const tokenData = await prisma.token.create({
            data: {
                address: mintAddress.toBase58(),
                ataAddress: ataAddress.toBase58(),
                decimals,
                name,
                authorityId: authority?.id as number,
            },
        })

        return { id: tokenData.id, mintAddress, ataAddress }
    }

    /**
     * Mints token on chain. Total supply of a token cannot exceed 100 Billion (check constant).
     * Only mints the difference of 100B and existing supply.
     *
     * E.g., If initial supply is 70 and max supply is 100, then this method
     * will allow to mint only 30 tokens
     */
    async mint({ mintAddress, ataAddress, amount }: MintArgs): Promise<void> {
        const token = await prisma.token.findFirst({
            select: { address: true, decimals: true },
            where: { address: mintAddress.toBase58() },
        })

        ataAddress = ataAddress || new PublicKey(token?.address as string)
        const tokenInfo = await getMint(connection, mintAddress)
        const supply = getBNFromBigInt(tokenInfo.supply)
        const remainingSupply = new BigNumber(MAX_TOKEN_SUPPLY).minus(supply)

        if (remainingSupply.isZero()) {
            throw new Error(errors.ALREADY_MAX_SUPPLY)
        } else if (
            isBNGreaterThanMaxSupply(supply, token?.decimals as number)
        ) {
            throw new Error(errors.INVALID_SUPPLY_AMOUNT)
        }

        await mintTo(
            connection,
            this.owner,
            mintAddress,
            ataAddress,
            this.owner.publicKey,
            getBigIntFromBN(amount)
        )
    }
}

export default TokenManager
