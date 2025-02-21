import { getConnectionStringFromEnv } from "pg-connection-from-env"
import { Context } from "./get-project-context"
import { generateSchema } from "./lib/generate-schema"
import { generateStructure } from "./lib/generate-structure"
import { generateTypes } from "./lib/generate-types"
import { generateGetDbClient } from "./lib/generate-get-db-client"

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

  await generateTypes({
    zapatos_dir: `${zapatosDir ?? dbDir}/zapatos`,
    output_dir: `${dbDir}/types`,
  })

  await generateStructure({
    database_name: defaultDatabase,
    output_dir: dbDir,
    schemas,
  })

  generateGetDbClient({
    types_dir: `${dbDir}/types`,
    output_dir: dbDir,
  })
}
