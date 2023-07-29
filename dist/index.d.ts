declare function createMigration(name: string): Promise<void>;
declare function migrate(): Promise<void>;

type Context = {
    cwd: string;
    defaultDatabase: string;
};

declare const reset: (ctx: Context) => Promise<void>;

declare const generate: ({ schemas }: {
    schemas: string[];
}) => Promise<void>;

export { createMigration, generate, migrate, reset };
