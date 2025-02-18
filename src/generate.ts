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
    schemas,
    defaultDatabase,
    dbDir,
  })

  await generateStructure({
    schemas,
    defaultDatabase,
    dbDir,
  })
}
