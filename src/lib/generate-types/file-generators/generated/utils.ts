import { type Config } from "../../types"
import { type Project, type SourceFile } from "ts-morph"

export const createGeneratedUtilsFile = (
  args: {
    project: Project
  },
  config: Config,
): SourceFile => {
  const { project } = args
  const { output_dir } = config

  const file_source = `import type { JSONValue } from "zapatos/db"
import { type ColumnType } from "kysely"

type PartialWithNever<T> = {
  [P in keyof T as T[P] extends never ? never : P]?: T[P]
} & {
  [P in keyof T as T[P] extends never ? P : never]: T[P]
}

export type KyselyTable<Selectable, Initializer> = {
  [K in keyof Selectable]: ColumnType<
    Selectable[K],
    K extends keyof Initializer ? Initializer[K] : never,
    K extends keyof PartialWithNever<Initializer>
      ? PartialWithNever<Initializer>[K]
      : never
  >
}

type KeysOfUnion<T> = T extends T ? keyof T : never

type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never
}[keyof T]

/**
 * Allows creating a type that is a subset of another type.
 */
export type SubsetOf<
  Super,
  Sub extends {
    // The types of keys present in sub must be assignable to the types of the same keys in super
    [K in keyof Super as K extends KeysOfUnion<Sub> ? K : never]: Super[K]
  } & {
    // Keys that are nullable in super must stay nullable in sub
    [K in keyof Sub as K extends NullableKeys<Super>
      ? K
      : never]: null extends Sub[K] ? any : null
  } & {
    // Keys in sub must exist in super
    [K in keyof Sub as K extends keyof Super ? never : K]: never
  }
> = Sub

// Replaces the values of From with the values of To and ignores the rest of the properties of To
type ReplaceValueTypes<From, To> = Omit<From, keyof To> &
  Pick<To, Extract<keyof To, keyof From>>

// Works to make From properties optional but it would not work to make them mandatory as From[K] would include undefined
// TODO improve to keep unions (if possible)
type ReplaceKeyTypes<From, To> = {
  [K in keyof To as K extends keyof From ? K : never]: K extends keyof From
    ? From[K]
    : never
} & {
  [K in keyof From as K extends keyof To ? never : K]: From[K]
}

export type CustomizeDbType<DbType, CustomProperties> = ReplaceValueTypes<
  DbType,
  CustomProperties
>

export type CustomizeDbTypeInitializer<DbTypeInitializer, CustomProperties> =
  ReplaceValueTypes<
    DbTypeInitializer,
    ReplaceKeyTypes<CustomProperties, DbTypeInitializer>
  >

// TODO Migrating from pgtui to our custom types is a pain because of two bugs in pgtui.
// This type is a workaround to make the migration easier and should be removed later.
// To remove it, we need to fix a lot of type errors. It can be done per table thanks
// to a configuration option of generate-types.
export type ReproducePgtuiBugs<T> = {
  [K in keyof T]: K extends \`\${string}_id\`
    ? string
    : ReplaceJSONValueWithAny<T[K]>
}

type ReplaceJSONValueWithAny<T> = [JSONValue] extends [T] ? any : T`

  return project.createSourceFile(
    `${output_dir}/generated/utils.ts`,
    file_source,
    {
      overwrite: true,
    },
  )
}
