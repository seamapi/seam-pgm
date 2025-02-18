import { dumpTree } from "pg-schema-dump"
import path from "path"

export const generateStructure = async (args: {
  database_url: string
  schemas: string[]
  output_dir: string
}) => {
  const { database_url, schemas, output_dir } = args

  await dumpTree({
    targetDir: path.join(output_dir, "structure"),
    defaultDatabase: database_url,
    schemas,
  })
}
