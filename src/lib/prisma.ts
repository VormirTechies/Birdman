import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function withDatabaseName(uri: string | undefined) {
  if (!uri) return undefined;
  const queryStart = uri.indexOf("?");
  const base = queryStart === -1 ? uri : uri.slice(0, queryStart);
  const query = queryStart === -1 ? "" : uri.slice(queryStart);

  return base.endsWith("/") ? `${base}birdman${query}` : uri;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: withDatabaseName(process.env.MONGODB_URI),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
