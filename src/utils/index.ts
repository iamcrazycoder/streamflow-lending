import { Keypair, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import base58 from 'bs58'
import { MAX_TOKEN_SUPPLY } from '../constants'
import errors from '../constants/errors'

export const getTokenMaxSupply = (decimals: number): BigNumber =>
    getBN(MAX_TOKEN_SUPPLY, decimals)

export const getBN = (value: number | string, decimals: number = 0) =>
    new BigNumber(value).multipliedBy(new BigNumber(10).pow(decimals))

export const getNumberFromBN = (bn: BigNumber, decimals: number): string =>
    bn.div(new BigNumber(10).pow(decimals)).toFormat()

export const isBNGreaterThanMaxSupply = (
    value: BigNumber,
    decimals: number
): boolean => value.gt(getTokenMaxSupply(decimals))

export const getPercentOfMaxSupply = (
    value: BigNumber,
    decimals: number,
    supply?: string
): number =>
    supply
        ? value.div(getBN(supply)).toNumber()
        : value.div(getTokenMaxSupply(decimals)).toNumber()

export const getBNFromBigInt = (value: bigint): BigNumber =>
    new BigNumber(value.toString())

export const getBigIntFromBN = (value: BigNumber): bigint =>
    BigInt(value.toString())

export const decodeStringToKeyPair = (value: string): Keypair =>
    Keypair.fromSecretKey(base58.decode(value))

export const encodeKeyPairToString = (kp: Keypair): string =>
    base58.encode(kp.secretKey)

export const validateSolanaAddress = (address: string) => {
    try {
        const pk = new PublicKey(address)
        if (!PublicKey.isOnCurve(pk.toBytes())) {
            throw 'invalid'
        }
    } catch (error) {
        throw new Error(errors.INVALID_SOL_ADDRESS)
    }
}
