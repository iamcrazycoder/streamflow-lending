import express from 'express'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { init } from './config'
import routers from './routes'

const env = dotenv.config()
dotenvExpand.expand(env)

init()

const app = express()

app.use(express.json())
app.use(express.urlencoded())

app.get('/', (_req, res) => {
    res.send(
        'Welcome to Streamflow lending! Refer to the API documentation for usage.'
    )
})

if (!process.env.PORT) {
    throw new Error('PORT is missing in .env file')
}

// Bind all routes from imported routers
routers.forEach((route) => {
    app.use(route.basePath, route.routes)
})

app.listen(process.env.PORT, () => {
    console.log(`Server listening on port: ${process.env.PORT}`)
})
