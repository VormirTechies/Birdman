import "dotenv/config";

import { PrismaClient } from "@prisma/client";

function withDatabaseName(uri: string | undefined) {
  if (!uri) return undefined;
  const queryStart = uri.indexOf("?");
  const base = queryStart === -1 ? uri : uri.slice(0, queryStart);
  const query = queryStart === -1 ? "" : uri.slice(queryStart);

  return base.endsWith("/") ? `${base}birdman${query}` : uri;
}

const prisma = new PrismaClient({
  datasourceUrl: withDatabaseName(process.env.MONGODB_URI),
});

async function main() {
  const count = await prisma.samplePost.count();

  if (count > 0) {
    console.log(`Sample data already exists (${count} posts); nothing to seed.`);
    return;
  }

  await prisma.samplePost.createMany({
    data: [
      {
        title: "MongoDB Atlas is connected",
        content: "This record was created by the Prisma seed script.",
      },
      {
        title: "Try the sample API",
        content: "Use the form on /mongodb-demo or call /api/sample-posts directly.",
      },
    ],
  });

  console.log("Created 2 sample posts in MongoDB Atlas.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
