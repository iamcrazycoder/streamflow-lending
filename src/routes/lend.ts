import { PublicKey } from '@solana/web3.js'
import { Router } from 'express'
import errors from '../constants/errors'
import Lend from '../models/Lend'
import TokenManager from '../models/TokenManager'
import { getBN, validateSolanaAddress } from '../utils'

const router = Router()

router.post('/request-loan', async (req, res) => {
    try {
        const requestBody = req.body

        if (
            !requestBody.userAddress ||
            !requestBody.mintAddress ||
            !requestBody.amount
        ) {
            return res.status(400).send(errors.INVALID_REQUEST)
        }

        validateSolanaAddress(requestBody.userAddress as string)
        validateSolanaAddress(requestBody.mintAddress as string)

        const userAddress = new PublicKey(requestBody.userAddress as string)
        const mintAddress = new PublicKey(requestBody.mintAddress as string)
        const tokenInfo = await TokenManager.getTokenInfo(mintAddress)
        const amount = getBN(requestBody.amount as string, tokenInfo.decimals)

        const lend = new Lend(userAddress)

        const data = await lend.disburseLoan({
            amount,
            mintAddress,
        })

        res.send(data)
    } catch (error: any) {
        res.status(400).send(error.message)
    }
})

router.get('/get-outstanding-loans', async (req, res) => {
    try {
        const requestBody = req.query

        if (!requestBody.userAddress) {
            return res.status(400).send(errors.INVALID_REQUEST)
        }

        validateSolanaAddress(requestBody.userAddress as string)

        const userAddress = new PublicKey(requestBody.userAddress as string)
        const lend = new Lend(userAddress)
        const data = await lend.getOutstandingLoans({ returnReadable: true })

        res.send(data)
    } catch (error: any) {
        res.status(500).send(error.message)
    }
})

router.get('/get-all-outstanding-loans', async (req, res) => {
    try {
        const requestBody = req.query
        validateSolanaAddress(requestBody.authorityAddress as string)

        const authorityAddress = new PublicKey(
            requestBody.authorityAddress as string
        )
        const allOutstandingLoans = await Lend.getAllOutstandingLoans(
            authorityAddress
        )

        res.send(allOutstandingLoans)
    } catch (error: any) {
        res.status(500).send(error.message)
    }
})

export { router }
