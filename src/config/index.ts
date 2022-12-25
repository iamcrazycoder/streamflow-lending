import BigNumber from 'bignumber.js'

function init() {
    BigNumber.config({
        FORMAT: {
            groupSeparator: '',
            groupSize: 0,
            decimalSeparator: '.',
        },
    })

    // @ts-ignore
    BigInt.prototype.toJSON = function () {
        return this.toString()
    }
}

export { init }
