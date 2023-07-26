// seam-pgm.ts
import nodePgMigrate from "node-pg-migrate"
import * as zg from "zapatos/generate"
import { Client } from "pg"
import Debug from "debug"
import {
  getConnectionStringFromEnv,
  getPgConnectionFromEnv,
} from "pg-connection-from-env"
import * as childProcess from "child_process"

const debug = Debug("seam-node-pg-migrate")

export async function createMigration(name: string) {
  childProcess.execSync(
    `npx node-pg-migrate --migration-file-language ts -m src/db/migrations create ${name}`
  )
  console.log(`Migration ${name} created`)
}

export async function migrate() {
  const client = new Client(getConnectionStringFromEnv())
  await client.connect()

  let logger =
    debug.enabled || process.env.NODE_ENV !== "test"
      ? console
      : {
          ...console,
          info: () => null,
          log: () => null,
        }

  await Promise.all([
    nodePgMigrate({
      dbClient: client,
      direction: "up",
      schema: "migrations",
      createSchema: true,
      migrationsTable: "pgmigrations",
      verbose: false,
      dir: "./src/db/migrations",
      logger,
    } as any),
  ])

  const schemas = ["public"]
  const db = getPgConnectionFromEnv(),
  await zg.generate({
    db: 
    schemas: Object.fromEntries(
      schemas.map((s) => [
        s,
        {
          include: "*",
          exclude: [],
        },
      ])
    ),
    outDir: "./src/db/zapatos",
  })

  await client.end()

  console.log("Migrations completed")
}
