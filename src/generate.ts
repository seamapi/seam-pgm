import { getConnectionStringFromEnv } from "pg-connection-from-env"
import { Context } from "./get-project-context"
import { generateSchema } from "./lib/generate-schema"
import { generateStructure } from "./lib/generate-structure"

export const generate = async ({
  schemas,
  defaultDatabase,
  dbDir,
}: Pick<Context, "schemas" | "defaultDatabase" | "dbDir">) => {
  dbDir = dbDir ?? "./src/db"

  await generateSchema({
    connection_string: getConnectionStringFromEnv({
      fallbackDefaults: {
        database: defaultDatabase,
      },
    }),
    output_dir: dbDir,
    schemas,
  })

  await generateStructure({
    schemas,
    defaultDatabase,
    dbDir,
  })
}
