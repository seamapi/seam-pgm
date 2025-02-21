import type { Config, Schema } from "../../types"
import { pascalCase } from "../../utils"
import {
  StructureKind,
  type SourceFile,
  type Project,
  type StatementedNodeStructure,
} from "ts-morph"

export const createKnexIndexFile = (
  args: {
    project: Project
    schemas: Schema[]
  },
  config: Config,
): SourceFile => {
  const { project, schemas } = args
  const { output_dir } = config

  const statements: StatementedNodeStructure["statements"] = []
  const module_interface_statements: StatementedNodeStructure["statements"] = []

  for (const schema of schemas) {
    if (Object.values(schema.tables).length === 0) continue

    statements.push({
      kind: StructureKind.ImportDeclaration,
      moduleSpecifier: `./${schema.name}`,
      namedImports: [
        {
          name: "KnexSchemaTypeMap",
          alias: `${pascalCase(schema.name)}TypeMap`,
        },
      ],
    })

    module_interface_statements.push({
      kind: StructureKind.Interface,
      name: "Tables",
      extends: [`${pascalCase(schema.name)}TypeMap`],
      properties: [],
    })
  }

  // Create the module declaration
  statements.push({
    kind: StructureKind.Module,
    name: `"knex/types/tables"`,
    hasDeclareKeyword: true,
    statements: module_interface_statements,
  })

  // Create the source file
  return project.createSourceFile(
    `${output_dir}/generated/knex.ts`,
    {
      statements,
    },
    { overwrite: true },
  )
}
