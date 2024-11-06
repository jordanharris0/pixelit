const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function main() {
  // Hash password for users
  const passwordHash = await bcrypt.hash("password123", 10);

  // Seed Users
  const [user1, user2, admin] = await Promise.all([
    prisma.user.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        email: "john@example.com",
        password: passwordHash,
        bio: "Just an artist trying to share my work!",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Jane",
        lastName: "Smith",
        username: "janesmith",
        email: "jane@example.com",
        password: passwordHash,
        bio: "I love pixel art!",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: "User",
        username: "adminuser",
        email: "admin@example.com",
        password: passwordHash,
        role: "ADMIN",
        bio: "Admin of Pixelit.",
      },
    }),
  ]);

  // Seed Projects
  const [project1, project2] = await Promise.all([
    prisma.project.create({
      data: {
        title: "Sunset Landscape",
        description: "A beautiful pixel art landscape of a sunset.",
        tags: ["landscape", "sunset"],
        isPublic: true,
        userId: user1.userId,
      },
    }),
    prisma.project.create({
      data: {
        title: "City Skyline",
        description: "Pixel art of a bustling city skyline at night.",
        tags: ["city", "night"],
        isPublic: true,
        userId: user2.userId,
      },
    }),
  ]);

  // Seed Canvas Data
  await Promise.all([
    prisma.canvasData.create({
      data: {
        projectId: project1.projectId,
        frameNumber: 1,
        width: 32,
        height: 32,
        pixels: JSON.stringify([
          { x: 0, y: 0, color: "#FF5733" },
          { x: 1, y: 1, color: "#33FF57" },
        ]),
      },
    }),
    prisma.canvasData.create({
      data: {
        projectId: project1.projectId,
        frameNumber: 2,
        width: 32,
        height: 32,
        pixels: JSON.stringify([
          { x: 0, y: 1, color: "#5733FF" },
          { x: 1, y: 0, color: "#FF33A6" },
        ]),
      },
    }),
    prisma.canvasData.create({
      data: {
        projectId: project2.projectId,
        frameNumber: 1,
        width: 64,
        height: 64,
        pixels: JSON.stringify([
          { x: 0, y: 0, color: "#FF5733" },
          { x: 5, y: 5, color: "#3385FF" },
        ]),
      },
    }),
  ]);

  // Seed other data (Likes, Comments, Bookmarks, etc.)
  // ... (same as the previous seed example)

  console.log("Seeding complete!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
