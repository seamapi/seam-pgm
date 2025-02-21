import type { Config, Schema, Table } from "../../../types"
import { pascalCase } from "../../../utils"
import {
  StructureKind,
  type Project,
  type SourceFile,
  type StatementedNodeStructure,
} from "ts-morph"

export const createCustomTypesFile = (
  args: {
    project: Project
    schema: Schema
    table: Table
  },
  config: Config
): SourceFile => {
  const { project, schema, table } = args
  const { output_dir } = config

  const pascal_table_name = pascalCase(table.name)

  const statements: StatementedNodeStructure["statements"] = [
    {
      kind: StructureKind.ImportDeclaration,
      namedImports: ["SubsetOf"],
      moduleSpecifier: "../../generated/utils",
      isTypeOnly: true,
    },
    {
      kind: StructureKind.ImportDeclaration,
      namedImports: [`Selectable${pascal_table_name}`],
      moduleSpecifier: `../../generated/${schema.name}/${pascal_table_name}QueryTypes`,
      isTypeOnly: true,
    },
    (writer) => writer.blankLine(),
    {
      kind: StructureKind.TypeAlias,
      name: `${pascal_table_name}CustomTypes`,
      type: `SubsetOf<Selectable${pascal_table_name}, {}>`,
      isExported: true,
    },
    (writer) => writer.blankLine(),
    {
      kind: StructureKind.ExportAssignment,
      isExportEquals: false,
      expression: `${pascal_table_name}CustomTypes`,
    },
  ]

  return project.createSourceFile(
    `${output_dir}/custom/${schema.name}/${pascal_table_name}CustomTypes.ts`,
    {
      statements,
    },
    {
      overwrite: false,
    }
  )
}
