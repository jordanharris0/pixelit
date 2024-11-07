const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function main() {
  // Hash password for users
  const passwordHash = await bcrypt.hash("testing", 10);

  // Seed Users
  const [user1, user2, admin] = await Promise.all([
    prisma.user.create({
      data: {
        firstName: "Jordan",
        lastName: "Harris",
        username: "jordan",
        email: "jordan@example.com",
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
        username: "admin",
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

  // Seed Likes
  await Promise.all([
    prisma.like.create({
      data: {
        userId: user2.userId,
        projectId: project1.projectId,
      },
    }),
    prisma.like.create({
      data: {
        userId: user1.userId,
        projectId: project2.projectId,
      },
    }),
  ]);

  // Seed Comments
  await Promise.all([
    prisma.comment.create({
      data: {
        userId: user1.userId,
        projectId: project2.projectId,
        content: "Amazing work!",
      },
    }),
    prisma.comment.create({
      data: {
        userId: user2.userId,
        projectId: project1.projectId,
        content: "I love the colors!",
      },
    }),
  ]);

  // Seed Bookmarks
  await prisma.bookmark.create({
    data: {
      userId: user1.userId,
      projectId: project2.projectId,
    },
  });

  // Seed Downloads
  await prisma.download.create({
    data: {
      userId: user2.userId,
      projectId: project1.projectId,
    },
  });

  // Seed Notifications
  await prisma.notification.create({
    data: {
      userId: user1.userId,
      projectId: project1.projectId,
      type: "LIKE",
      message: "Your project received a new like!",
    },
  });

  // Seed Reports
  await prisma.report.create({
    data: {
      reason: "Inappropriate content",
      user: {
        connect: { userId: user1.userId },
      },
      project: {
        connect: { projectId: project2.projectId },
      },
    },
  });

  // Seed Template Layers
  await prisma.templateLayer.create({
    data: {
      projectId: project1.projectId,
      imageUrl: "https://example.com/template1.png",
      opacity: 0.5,
      positionX: 10,
      positionY: 20,
      scale: 1.2,
    },
  });

  // Seed Animation Settings
  await prisma.animationSetting.create({
    data: {
      projectId: project1.projectId,
      frameRate: 15,
      loop: true,
      exportFormat: "GIF",
    },
  });

  // Seed Collaboration
  await prisma.collaboration.create({
    data: {
      projectId: project1.projectId,
      userId: user2.userId,
      role: "EDITOR",
    },
  });

  // Seed Activity Logs
  await prisma.activityLog.create({
    data: {
      userId: admin.userId,
      actionType: "DELETE_PROJECT",
      description: "Deleted a project due to inappropriate content.",
    },
  });

  // Seed Project Versions
  await prisma.version.create({
    data: {
      projectId: project1.projectId,
      pixels: JSON.stringify([
        { x: 1, y: 1, color: "#FF5733" },
        { x: 2, y: 2, color: "#33FF57" },
      ]),
    },
  });

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
