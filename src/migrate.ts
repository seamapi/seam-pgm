// seam-pgm.ts
import nodePgMigrate from "node-pg-migrate"
import * as zg from "zapatos/generate"
import { Client } from "pg"
import Debug from "debug"
import { getConnectionStringFromEnv } from "pg-connection-from-env"
import * as childProcess from "child_process"

const debug = Debug("seam_pgm")

export async function createMigration(name: string) {
  childProcess.execSync(
    `node-pg-migrate --migration-file-language ts -m src/db/migrations create ${name}`
  )
  console.log(`Migration ${name} created`)
}

export async function reset() {
  const client = new Client(getConnectionStringFromEnv())
  await client.connect()
  await client.query("DROP SCHEMA IF EXISTS public CASCADE")
  await client.query("CREATE SCHEMA public")
  await client.end()
  console.log("Database reset completed")
  await migrate()
}

export async function migrateAndGenerate() {
  await migrate()
  childProcess.execSync("tbls doc -o src/db/structure")
  console.log("Migrations and structure generation completed")
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

  const schemas = ["sp", "devops", "graphile_worker", "diagnostics", "auth0"]
  await zg.generate({
    db: getClientConfigFromEnv(),
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
