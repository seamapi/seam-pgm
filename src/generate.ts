import { getConnectionStringFromEnv } from "pg-connection-from-env"
import { Context } from "./get-project-context"
import { generateSchema } from "./lib/generate-schema"
import { generateStructure } from "./lib/generate-structure"

export const generate = async (
  args: Pick<Context, "schemas" | "defaultDatabase" | "dbDir" | "zapatosDir">,
) => {
  const { schemas, defaultDatabase, dbDir = "./src/db", zapatosDir } = args

  const database_url = getConnectionStringFromEnv({
    fallbackDefaults: {
      database: defaultDatabase,
    },
  })

  await generateSchema({
    database_url,
    output_dir: zapatosDir ?? dbDir,
    schemas,
  })

  await generateStructure({
    database_url,
    output_dir: dbDir,
    schemas,
  })
}
