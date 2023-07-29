# Seam node-pg-migrate (seam-pgm)

Seam uses node-pg-migrate to run database migrations.

node-pg-migrate requires some custom commands/setup to be compatible with
the typical seam configuration. Namely...

- Use Typescript
- Put migrations in `src/db/migrations`
- "Standard Shorthands" for uuids and `created_at` timestamps
- Code to automatically run migrations in tests
- Automatic zapatos/kysely type generation
- Reset database and migrate scripts
- Automatic `src/db/structure` which dumps the database structure

This module encapsulates all that functionality into one, easy-to-use
module.

## Usage

### Scripts

> Note: `seam-node-pg-migrate` is abbreviated to `seam-pgm`, either is valid
> as an executable

- `seam-pgm create-migration` - create new migration
- `seam-pgm reset` - drop database and recreate, then migrate
- `seam-pgm migrate` - migrate database
- `seam-pgm migrate-and-generate` - migrate database and generate new types and structure
