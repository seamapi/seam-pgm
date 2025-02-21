import type { Column, Config, DatabaseTree, Schema, Table } from "./types"
import {
  type InterfaceDeclaration,
  Project,
  type PropertySignature,
  SyntaxKind,
} from "ts-morph"

export const readDatabaseTree = (config: Config): DatabaseTree => {
  const { zapatos_dir } = config

  const project = new Project()

  const zapatos_custom_types = readCustomZapatosTypes(config)

  const source_file = project.addSourceFileAtPath(`${zapatos_dir}/schema.d.ts`)
  const zapatos_module = source_file.getModules()[0]

  if (!zapatos_module) {
    throw new Error("Could not find the zapatos module in the schema file")
  }

  const schemas: Record<string, Schema> = {}
  for (const schema_module of zapatos_module.getModules()) {
    const schema_name = schema_module.getName()
    const tables: Record<string, Table> = {}

    for (const table_module of schema_module.getModules()) {
      const is_table =
        table_module
          .getStatementByKind(SyntaxKind.TypeAliasDeclaration)
          ?.getName() === "Table"

      if (!is_table) {
        continue
      }
      const table_name = table_module.getName()
      const is_customizable = isTableCustomizable(
        {
          schema_name,
          table_name,
        },
        config
      )
      const is_affected_by_pgtui_bugs = isTableAffectedByPgtuiBugs(
        {
          schema_name,
          table_name,
        },
        config
      )

      const table = {
        name: table_name,
        selectable_columns: {},
        insertable_columns: {},
        is_customizable,
        is_affected_by_pgtui_bugs,
        uses_zapatos_column_type: false,
      }

      table.selectable_columns = getColumns(
        table_module.getInterfaceOrThrow("Selectable"),
        table,
        zapatos_custom_types
      )
      table.insertable_columns = getColumns(
        table_module.getInterfaceOrThrow("Insertable"),
        table,
        zapatos_custom_types
      )

      tables[table_name] = table
    }

    schemas[schema_name] = {
      name: schema_name,
      tables,
    }
  }

  return {
    schemas,
  }
}

const isTableCustomizable = (
  args: { schema_name: string; table_name: string },
  config: Config
) => {
  const { schema_name, table_name } = args
  const { customizable_tables } = config

  const schema_customizable_tables = customizable_tables?.[schema_name]
  return (
    schema_customizable_tables === "all" ||
    (schema_customizable_tables?.includes(table_name) ?? false)
  )
}

const isTableAffectedByPgtuiBugs = (
  args: { schema_name: string; table_name: string },
  config: Config
) => {
  const { schema_name, table_name } = args
  const { reproduce_pgtui_bugs_for_tables } = config

  const pgtui_affected_tables = reproduce_pgtui_bugs_for_tables?.[schema_name]
  return pgtui_affected_tables?.includes(table_name) ?? false
}

const readCustomZapatosTypes = (config: Config) => {
  const { zapatos_dir } = config

  const project = new Project()
  const custom_zapatos_types: Record<string, string> = {}

  const source_files = project.addSourceFilesAtPaths(
    `${zapatos_dir}/custom/**/*.d.ts`
  )

  for (const source_file of source_files) {
    const zapatos_module = source_file.getModules()[0]

    if (!zapatos_module) {
      throw new Error("Could not find the zapatos module in the schema file")
    }

    for (const type_alias of zapatos_module.getTypeAliases()) {
      custom_zapatos_types[type_alias.getName()] = type_alias
        .getTypeNodeOrThrow()
        .getText()
    }
  }
  return custom_zapatos_types
}

const getColumns = (
  table_interface: InterfaceDeclaration,
  table: Table,
  zapatos_custom_types: Record<string, string>
) => {
  const columns: Record<string, Column> = {}

  for (const column of table_interface.getProperties()) {
    const column_name = column.getName()
    const column_type = customizeType(column, zapatos_custom_types)

    if (column_type.includes("db.")) {
      table.uses_zapatos_column_type = true
    }

    columns[column_name] = {
      name: column_name,
      type: column_type,
      is_optional: column.hasQuestionToken(),
      comments: [],
    }
  }

  return columns
}

const customizeType = (
  column: PropertySignature,
  zapatos_custom_types: Record<string, string>
) => {
  const type_node = column.getTypeNodeOrThrow()
  const is_union = type_node.getKind() === SyntaxKind.UnionType

  const type_members = is_union
    ? type_node
        .asKindOrThrow(SyntaxKind.UnionType)
        .getTypeNodes()
        .map((node) => node.getText())
    : [type_node.getText()]

  let customized_type_members = type_members
  customized_type_members = removeZapatosSpecificTypes(customized_type_members)
  customized_type_members = replaceSvixMessageStatusEnum(
    customized_type_members
  )
  customized_type_members = replaceCustomZapatosTypesWithTheirDefinitions(
    customized_type_members,
    zapatos_custom_types
  )
  customized_type_members = replaceJSONValueWithNonNullableVersion(
    customized_type_members
  )

  return customized_type_members.join(" | ")
}

const removeZapatosSpecificTypes = (type_members: string[]) =>
  type_members.filter(
    (member) =>
      !(
        member === "db.DefaultType" ||
        member.startsWith("db.Parameter") ||
        member.startsWith("db.SQLFragment")
      )
  )

const replaceCustomZapatosTypesWithTheirDefinitions = (
  type_members: string[],
  zapatos_custom_types: Record<string, string>
) =>
  type_members.map((member) =>
    member.startsWith("c.Pg")
      ? zapatos_custom_types[member.slice(2)] ?? member
      : member
  )

/**
 * For some reason Zapatos generates a type `db.JSONValue` which is nullable.
 * This is an issue as it means non-nullable jsonb columns are not correctly
 * represented in the generated types.
 */
const replaceJSONValueWithNonNullableVersion = (type_members: string[]) =>
  type_members.map((member) =>
    member === "db.JSONValue" ? "NonNullable<db.JSONValue>" : member
  )

const replaceSvixMessageStatusEnum = (type_members: string[]) =>
  type_members.map((member) =>
    member === "svix_message_status_enum"
      ? `"no_svix_app" | "sent" | "unsent"`
      : member
  )
