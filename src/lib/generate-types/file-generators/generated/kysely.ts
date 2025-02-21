import type { Config, Schema } from "../../types"
import { pascalCase } from "../../utils"
import {
  StructureKind,
  type SourceFile,
  type Project,
  type StatementedNodeStructure,
} from "ts-morph"

export const createKyselyIndexFile = (
  args: {
    project: Project
    schemas: Schema[]
  },
  config: Config
): SourceFile => {
  const { project, schemas } = args
  const { output_dir } = config

  const type_references: string[] = []

  const statements: StatementedNodeStructure["statements"] = [
    {
      kind: StructureKind.ImportDeclaration,
      moduleSpecifier: "kysely",
      namedImports: ["Kysely", "Transaction"],
      isTypeOnly: true,
    },
  ]

  for (const schema of schemas) {
    if (Object.values(schema.tables).length === 0) continue

    statements.push({
      kind: StructureKind.ImportDeclaration,
      moduleSpecifier: `./${schema.name}`,
      namedImports: [
        {
          name: "KyselySchemaTypeMap",
          alias: `${pascalCase(schema.name)}TypeMap`,
        },
      ],
      isTypeOnly: true,
    })

    type_references.push(`${pascalCase(schema.name)}TypeMap`)
  }

  statements.push(
    (writer) => writer.newLine(),
    {
      kind: StructureKind.TypeAlias,
      name: "KyselySchema",
      isExported: true,
      type: type_references.join(" & "),
    },
    (writer) => writer.newLine(),
    {
      kind: StructureKind.TypeAlias,
      name: "KyselyDatabase",
      isExported: true,
      type: `Kysely<KyselySchema>`,
    },
    {
      kind: StructureKind.TypeAlias,
      name: "KyselyTransaction",
      isExported: true,
      type: `Transaction<KyselySchema>`,
    }
  )

  return project.createSourceFile(
    `${output_dir}/generated/kysely.ts`,
    {
      statements,
    },
    { overwrite: true }
  )
}
