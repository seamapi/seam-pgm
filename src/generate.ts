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

  const database_url = getConnectionStringFromEnv({
    fallbackDefaults: {
      database: defaultDatabase,
    },
  })

  await generateSchema({
    database_url,
    output_dir: dbDir,
    schemas,
  })

  await generateStructure({
    database_url,
    output_dir: dbDir,
    schemas,
  })
}
