import { pascalCase } from "../../utils"
import type { Config, Schema } from "../../types"
import {
  type Project,
  type StatementedNodeStructure,
  type SourceFile,
  StructureKind,
} from "ts-morph"

export const createGeneratedIndexFile = (
  args: {
    project: Project
    schemas: Schema[]
  },
  config: Config,
): SourceFile => {
  const { project, schemas } = args
  const { output_dir, main_schema = "public" } = config

  const schema_import_statements: StatementedNodeStructure["statements"] = []
  const schema_export_statements: StatementedNodeStructure["statements"] = []
  const schemas_tables: string[] = []

  for (const schema of schemas) {
    if (Object.values(schema.tables).length === 0) continue
    const pascal_schema_name = pascalCase(schema.name)

    schema_import_statements.push({
      kind: StructureKind.ImportDeclaration,
      moduleSpecifier: `./${schema.name}`,
      namedImports: [`${pascal_schema_name}Tables`],
    })
    schemas_tables.push(`${pascal_schema_name}Tables`)
    schema_export_statements.push({
      kind: StructureKind.ExportDeclaration,
      namespaceExport: schema.name === main_schema ? undefined : schema.name,
      moduleSpecifier: `./${schema.name}`,
    })
  }

  const statements: StatementedNodeStructure["statements"] = [
    ...schema_import_statements,
    (writer) => writer.newLine(),
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: "DatabaseSchemas",
      type: `[ ${schemas.map((schema) => `"${schema.name}"`).join(", ")} ]`,
    },
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: "DatabaseTables",
      type: `[ ${schemas_tables
        .map((schema_tables) => `...${schema_tables}`)
        .join(", ")} ]`,
    },
    (writer) => writer.newLine(),
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: "DatabaseSchema",
      type: "DatabaseSchemas[number]",
    },
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: "DatabaseTable",
      type: "DatabaseTables[number]",
    },
    (writer) => writer.newLine(),
    ...schema_export_statements,
    (writer) => writer.newLine(),
    {
      kind: StructureKind.ExportDeclaration,
      namespaceExport: "kysely",
      moduleSpecifier: "./kysely",
    },
  ]

  if (config.generate_knex_types) {
    statements.push({
      kind: StructureKind.ExportDeclaration,
      namespaceExport: "knex",
      moduleSpecifier: "./knex",
    })
  }

  return project.createSourceFile(
    `${output_dir}/generated/index.ts`,
    {
      statements,
    },
    { overwrite: true },
  )
}
