const { PrismaClient } = require("@prisma/client");
const env = require("./env");

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
} else {
  // Prevent multiple instances of Prisma Client in development due to hot reloading
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;
