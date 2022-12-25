import Authority from '../models/Authority'
import { init } from '../config'

init()

/**
 * Sets up authority wallet.
 * Requests SOL to cover tx fees on the platform
 * Creates off-chain record of the authority for platform-specific usage
 */
const setupAuthority = async () => {
    console.log('Setting up the authority/admin for this project..')
    const authority = new Authority()
    const [authorityPublicKey] = await authority.setup()
    console.log(
        'Authority restored from secret key. pubkey: ',
        authorityPublicKey
    )
    console.log('Authority setup complete!')
}

;(async () => {
    await setupAuthority()
})()
