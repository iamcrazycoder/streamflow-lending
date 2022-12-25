import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import connection from '../src/config/solana-connection'
import { MAX_PERCENT_OF_SUPPLY_IN_LOAN } from '../src/constants'
import errors from '../src/constants/errors'
import Authority from '../src/models/Authority'
import Lend from '../src/models/Lend'
import TokenManager from '../src/models/TokenManager'
import { DisburseLoanArgs } from '../src/types'
import { encodeKeyPairToString, getBN } from '../src/utils'

jest.setTimeout(60000)

interface TokenFixture {
    name: string
    supply: BigNumber
    decimals: number
    address?: PublicKey
}

let tokenFixture: TokenFixture = {
    name: 'TestLending-X',
    supply: getBN(1000, 9),
    decimals: 9,
}

let authorityAddress: PublicKey | null
let fixture: Partial<DisburseLoanArgs> = {}
let user: Keypair
let authorityKeypair: Keypair

beforeAll(async () => {
    console.log('Creating fixtures.. this may take some time')

    user = Keypair.generate()
    authorityKeypair = Keypair.generate()
    process.env.TOP_AUTHORITY = encodeKeyPairToString(authorityKeypair)

    const authority = new Authority()
    const [authorityPublicKey] = await authority.setup()
    authorityAddress = new PublicKey(authorityPublicKey)
    console.log('Created authority: ', authorityPublicKey)

    const tokenManager = new TokenManager()
    const response = await tokenManager.setupToken({
        ...tokenFixture,
        payer: authorityAddress,
    })
    console.log('Created token: ', response.mintAddress.toBase58())
    console.log('Created ATA: ', response.ataAddress.toBase58())

    tokenFixture.address = response.mintAddress
})

beforeEach(() => {
    fixture.amount = getBN(10, tokenFixture.decimals)
    fixture.mintAddress = tokenFixture.address
})

it('should fail if the users address is not valid', async () => {
    const userAddress = 'abc'

    try {
        new Lend(userAddress)
    } catch (error: any) {
        expect(error).toEqual(new Error('Invalid public key input'))
    }
})

it(`should throw if request amount is more than ${
    MAX_PERCENT_OF_SUPPLY_IN_LOAN * 100
}% of the total supply`, async () => {
    fixture.amount = getBN(100, tokenFixture.decimals) // 10%

    const lend = new Lend(user.publicKey)

    const test = async () =>
        await lend.disburseLoan(fixture as Required<DisburseLoanArgs>)

    expect(test).rejects.toThrowError(new Error(errors.MAX_LOAN_SUPPLIED))
})

it('should throw error if mintAddress is invalid', async () => {
    fixture.mintAddress = new PublicKey(
        '9Z2SCvKKEtqsz2dbrVzPjQ8WFHHi9fgth4iB3pVZKC9X'
    )

    const lend = new Lend(user.publicKey)
    const test = async () =>
        await lend.disburseLoan(fixture as Required<DisburseLoanArgs>)

    expect(test).rejects.toThrowError(new Error(errors.INVALID_TOKEN_MINT))
})

it('should throw error if authority attempts to take loan', async () => {
    const lend = new Lend(authorityAddress as PublicKey)
    const test = async () =>
        await lend.disburseLoan(fixture as Required<DisburseLoanArgs>)

    expect(test).rejects.toThrowError(new Error(errors.AUTHORITY_LOAN))
})

it('should disburse loan for correct amount, mint, user address (1st loan)', async () => {
    const lend = new Lend(user.publicKey)
    const response = await lend.disburseLoan(
        fixture as Required<DisburseLoanArgs>
    )

    const tx = await connection.getTransaction(response.txId, {
        commitment: 'confirmed',
    })
    expect(tx).toBeTruthy()
})

it('should disburse loan for correct amount, mint, user address (2nd loan)', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const lend = new Lend(user.publicKey)
    const response = await lend.disburseLoan(
        fixture as Required<DisburseLoanArgs>
    )

    const tx = await connection.getTransaction(response.txId, {
        commitment: 'confirmed',
    })
    expect(tx).toBeTruthy()
})

it('should disburse loan for correct amount, mint, user address (3rd loan)', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    fixture.amount = getBN(2, tokenFixture.decimals)

    const lend = new Lend(user.publicKey)
    const response = await lend.disburseLoan(
        fixture as Required<DisburseLoanArgs>
    )

    const tx = await connection.getTransaction(response.txId, {
        commitment: 'confirmed',
    })
    expect(tx).toBeTruthy()
})

it('should throw error because user already has 3 active loans', async () => {
    const lend = new Lend(user.publicKey)
    const test = async () =>
        await lend.disburseLoan(fixture as Required<DisburseLoanArgs>)

    expect(test).rejects.toThrowError(new Error(errors.MAX_ACTIVE_LOANS))
})
