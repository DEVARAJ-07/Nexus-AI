const { PrismaClient } = require("@prisma/client");

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances of Prisma Client in development hot reloading
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["info", "warn", "error"],
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;
