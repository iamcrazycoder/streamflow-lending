const errors = {
    INVALID_REQUEST: 'Invalid request',
    DEFINE_AUTHORITY: 'Error: define TOP_AUTHORITY (keypair of admin) in .env',
    UNAUTHORIZED: 'Unauthorized request',
    INVALID_AMOUNT: 'Invalid amount',
    INVALID_TOKEN_MINT: 'Invalid token mint/address',
    INVALID_TOKEN_DECIMALS: 'Invalid token decimals',
    MAX_SUPPLY: 'Token supply exceeds the maximum allowed limit',
    ALREADY_MAX_SUPPLY: 'Token supply has already reached the maximum limit',
    INVALID_SUPPLY_AMOUNT: 'Unable to mint the request amount.',
    MAX_ACTIVE_LOANS:
        'You have exceeded maximum allowable active loans. Close existing loans before requesting new one.',
    MAX_LOAN_SUPPLIED: 'You have exhausted the maximum loanable amount',
    AUTHORITY_LOAN: 'Authority cannot take loans',
}

export default errors
