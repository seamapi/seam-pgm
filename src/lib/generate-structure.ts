import { dumpTree } from "pg-schema-dump"
import path from "path"

export const generateStructure = async (args: {
  schemas: string[]
  defaultDatabase: string
  dbDir: string
}) => {
  const { schemas, defaultDatabase, dbDir } = args

  await dumpTree({
    targetDir: path.join(dbDir, "structure"),
    defaultDatabase,
    schemas,
  })
}
