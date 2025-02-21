import type { Config, Schema, Table } from "../../../types"
import { pascalCase } from "../../../utils"
import {
  type SourceFile,
  StructureKind,
  type Project,
  type StatementedNodeStructure,
} from "ts-morph"

export const createQueryTypesFile = (
  args: {
    project: Project
    schema: Schema
    table: Table
  },
  config: Config
): SourceFile => {
  const { project, schema, table } = args
  const { output_dir } = config

  const base_type_name = pascalCase(table.name)

  const statements: StatementedNodeStructure["statements"] = []

  if (table.uses_zapatos_column_type) {
    statements.push({
      kind: StructureKind.ImportDeclaration,
      moduleSpecifier: "zapatos/db",
      namespaceImport: "db",
      isTypeOnly: true,
    })
  }

  statements.push(
    (writer) => writer.newLine(),
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: `Selectable${base_type_name}`,
      type: (writer) =>
        writer.inlineBlock(() => {
          for (const column of Object.values(table.selectable_columns)) {
            writer.writeLine(
              `${column.name}${column.is_optional ? "?" : ""}: ${column.type};`
            )
          }
        }),
    },
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: `Insertable${base_type_name}`,
      type: (writer) =>
        writer.inlineBlock(() => {
          for (const column of Object.values(table.insertable_columns)) {
            writer.writeLine(
              `${column.name}${column.is_optional ? "?" : ""}: ${column.type};`
            )
          }
        }),
    }
  )

  return project.createSourceFile(
    `${output_dir}/generated/${schema.name}/${base_type_name}QueryTypes.ts`,
    {
      statements,
    },
    { overwrite: true }
  )
}
