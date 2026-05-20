/**
 * Port unique pour `next dev` dans ce dépôt.
 * Surcharge : PORT ou DEV_PORT dans .env.local (ex. PORT=3002)
 */
const fromEnv = process.env.PORT ?? process.env.DEV_PORT;
export const DEV_PORT = fromEnv ? Number(fromEnv) : 3001;
