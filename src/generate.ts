import * as zg from "zapatos/generate"
import {
  getConnectionStringFromEnv,
  getPgConnectionFromEnv,
} from "pg-connection-from-env"
import { Context } from "./get-project-context"
import { dumpTree } from "pg-schema-dump"

export const generate = async ({
  schemas,
  defaultDatabase,
}: Pick<Context, "schemas" | "defaultDatabase">) => {
  await zg.generate({
    db: {
      connectionString: getConnectionStringFromEnv({
        fallbackDefaults: {
          database: defaultDatabase,
        },
      }),
    },
    schemas: Object.fromEntries(
      schemas.map((s) => [
        s,
        {
          include: "*",
          exclude: [],
        },
      ])
    ),
    outDir: "./src/db",
  })

  await dumpTree({
    targetDir: "./src/db/structure",
    defaultDatabase,
    schemas,
  })
}
