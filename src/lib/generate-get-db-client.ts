import path from "path"
import * as fs from "fs"
import { mkdirpSync } from "mkdirp"

export const generateGetDbClient = (args: {
  types_dir: string
  output_dir: string
}) => {
  const { types_dir, output_dir } = args

  const file_path = path.join(output_dir, "get-db-client.ts")
  if (!fs.existsSync(file_path)) {
    mkdirpSync(file_path)
    fs.writeFileSync(file_path, getDbClientTemplate(types_dir))
  }
}

const getDbClientTemplate = (
  kysely_types_import: string,
) => `import { Kysely, PostgresDialect } from "kysely"
  import { Pool } from "pg"
  import pgmConfig from "../../seam-pgm.config"
  import { KyselyDatabase } from "${kysely_types_import}"
  import { getConnectionStringFromEnv } from "pg-connection-from-env"
  
  export const getDbClient = (): KyselyDatabase => {
    return new Kysely({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: getConnectionStringFromEnv({
            fallbackDefaults: {
              database: pgmConfig.defaultDatabase,
            },
          }),
        }),
      }),
    })
  }`
