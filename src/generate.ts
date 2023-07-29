import * as zg from "zapatos/generate"
import {
  getConnectionStringFromEnv,
  getPgConnectionFromEnv,
} from "pg-connection-from-env"

export const generate = async ({ schemas }: { schemas: string[] }) => {
  await zg.generate({
    db: {
      connectionString: getConnectionStringFromEnv(),
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
    outDir: "./src/db/zapatos",
  })
}
