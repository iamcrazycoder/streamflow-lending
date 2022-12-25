import { Token } from '@prisma/client'
import { Mint } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

interface SetupTokenArgs {
    decimals: number
    name: string
    payer: PublicKey
    supply: BigNumber
}

interface SetupTokenResponse {
    id: number
    mintAddress: PublicKey
    ataAddress: PublicKey
}

interface MintArgs {
    mintAddress: PublicKey
    ataAddress: PublicKey | null
    amount: BigNumber
}

interface TransferArgs {
    mintAddress: PublicKey
    to: PublicKey
    amount: BigNumber
}

interface CreateUserTokenATAArgs {
    mintAddress: PublicKey
    userAddress: PublicKey
}

interface OnChainTokenInfo {
    onChainInfo: Mint
}

type GetTokenInfoResponse = Token & OnChainTokenInfo

export {
    SetupTokenArgs,
    SetupTokenResponse,
    MintArgs,
    TransferArgs,
    CreateUserTokenATAArgs,
    GetTokenInfoResponse,
}
