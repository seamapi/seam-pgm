import type { Config, Schema } from "../../../types"
import { pascalCase } from "../../../utils"
import {
  StructureKind,
  type Project,
  type SourceFile,
  type StatementedNodeStructure,
} from "ts-morph"

export const createSchemaGeneratedTypeIndexFile = (
  args: {
    project: Project
    schema: Schema
  },
  config: Config,
): SourceFile => {
  const { project, schema } = args
  const { output_dir } = config

  const pascale_schema_name = pascalCase(schema.name)

  const tables = Object.values(schema.tables)
  const pascal_table_names = tables
    .map((table) => table.name)
    .reduce<Record<string, string>>((acc, table_name) => {
      acc[table_name] = pascalCase(table_name)
      return acc
    }, {})

  const statements: StatementedNodeStructure["statements"] = [
    {
      kind: StructureKind.ImportDeclaration,
      moduleSpecifier: "../utils",
      namedImports: ["KyselyTable"],
      isTypeOnly: true,
    },
  ]

  for (const table of tables) {
    statements.push({
      kind: StructureKind.ImportDeclaration,
      isTypeOnly: true,
      moduleSpecifier: `./${pascal_table_names[table.name]}`,
      namedImports: [
        pascal_table_names[table.name],
        ...(table.is_affected_by_pgtui_bugs
          ? [`${pascal_table_names[table.name]}WithPgtuiBugs`]
          : []),
        `${pascal_table_names[table.name]}Initializer`,
      ],
    })
  }

  statements.push(
    (writer) => writer.newLine(),
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: `${pascale_schema_name}Tables`,
      type: `[ ${tables
        .map((table) => `"${schema.name}.${table.name}"`)
        .join(", ")} ]`,
    },
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: `${pascale_schema_name}Table`,
      type: `${pascale_schema_name}Tables[number]`,
    },
    (writer) => writer.newLine(),
  )

  if (config.generate_knex_types) {
    statements.push({
      kind: StructureKind.Interface,
      isExported: true,
      name: "KnexSchemaTypeMap",
      properties: tables.map((table) => ({
        name:
          schema.name === "seam"
            ? table.name
            : `"${schema.name}.${table.name}"`,
        type: table.is_affected_by_pgtui_bugs
          ? `${pascal_table_names[table.name]}WithPgtuiBugs`
          : pascal_table_names[table.name],
      })),
    })
  }

  statements.push(
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: "KyselySchemaTypeMap",
      type: `{ ${tables
        .map(
          (table) =>
            `"${schema.name}.${table.name}": KyselyTable<${
              pascal_table_names[table.name]
            }, ${pascal_table_names[table.name]}Initializer>;`,
        )
        .join(" ")} }`,
    },
    (writer) => writer.newLine(),
    {
      kind: StructureKind.ExportDeclaration,
      isTypeOnly: true,
      namedExports: tables.flatMap((table) => [
        pascal_table_names[table.name],
        ...(table.is_affected_by_pgtui_bugs
          ? [`${pascal_table_names[table.name]}WithPgtuiBugs`]
          : []),
        `${pascal_table_names[table.name]}Initializer`,
      ]),
    },
  )

  return project.createSourceFile(
    `${output_dir}/generated/${schema.name}/index.ts`,
    {
      statements,
    },
    { overwrite: true },
  )
}
