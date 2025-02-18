import * as zg from "zapatos/generate"
import { getConnectionStringFromEnv } from "pg-connection-from-env"

export const generateSchema = async (args: {
  schemas: string[]
  defaultDatabase: string
  dbDir: string
}) => {
  const { schemas, defaultDatabase, dbDir } = args

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
      ]),
    ),
    outDir: dbDir,
  })
}
