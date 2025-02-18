import * as zg from "zapatos/generate"
import path from "node:path"
import fs from "node:fs/promises"

export const generateSchema = async (args: {
  database_url: string
  output_dir: string
  schemas: string[]
  excluded_tables_by_schema?: Record<string, string[]>
  module_name?: string
}) => {
  const {
    database_url,
    output_dir,
    schemas,
    excluded_tables_by_schema,
    module_name,
  } = args

  await zg.generate({
    db: {
      connectionString: database_url,
    },
    schemas: Object.fromEntries(
      schemas.map((schema) => [
        schema,
        {
          include: "*",
          exclude: excluded_tables_by_schema?.[schema] ?? [],
        },
      ]),
    ),
    schemaJSDoc: false,
    outDir: output_dir,
  })

  if (module_name) {
    const schema_file = path.join(output_dir, "zapatos/schema.d.ts")

    const contents = await fs.readFile(schema_file, "utf8")

    await fs.writeFile(
      schema_file,
      contents.replace("zapatos/schema", module_name),
    )
  }
}
