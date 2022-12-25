import { Router } from 'express'
import { router as lendRouter } from './lend'

interface Route {
    basePath: string
    routes: Router
}

const routes: Route[] = [
    { basePath: '/lend', routes: lendRouter as unknown as Router },
]

export default routes
