import prisma from '../../prisma'

// Handy script to truncate the database for fresh usage
;(async () => {
    await prisma.tx.deleteMany()
    await prisma.loan.deleteMany()
    await prisma.user.deleteMany()
})()
