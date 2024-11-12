const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// <---- seed new data v ---->
// async function main() {
//   // Hash password for users
//   const passwordHash = await bcrypt.hash("testing", 10);

//   // Seed Users
//   const [user1, user2, admin] = await Promise.all([
//     prisma.user.create({
//       data: {
//         firstName: "Jordan",
//         lastName: "Harris",
//         username: "jordan",
//         email: "jordan@example.com",
//         password: passwordHash,
//         bio: "Just an artist trying to share my work!",
//       },
//     }),
//     prisma.user.create({
//       data: {
//         firstName: "Jane",
//         lastName: "Smith",
//         username: "janesmith",
//         email: "jane@example.com",
//         password: passwordHash,
//         bio: "I love pixel art!",
//       },
//     }),
//     prisma.user.create({
//       data: {
//         firstName: "Admin",
//         lastName: "User",
//         username: "admin",
//         email: "admin@example.com",
//         password: passwordHash,
//         role: "ADMIN",
//         bio: "Admin of Pixelit.",
//       },
//     }),
//   ]);

//   // Seed Projects
//   const [project1, project2] = await Promise.all([
//     prisma.project.create({
//       data: {
//         title: "Sunset Landscape",
//         description: "A beautiful pixel art landscape of a sunset.",
//         tags: ["landscape", "sunset"],
//         isPublic: true,
//         userId: user1.userId,
//       },
//     }),
//     prisma.project.create({
//       data: {
//         title: "City Skyline",
//         description: "Pixel art of a bustling city skyline at night.",
//         tags: ["city", "night"],
//         isPublic: true,
//         userId: user2.userId,
//       },
//     }),
//   ]);

//   // Seed Canvas Data
//   await Promise.all([
//     prisma.canvasData.create({
//       data: {
//         projectId: project1.projectId,
//         frameNumber: 1,
//         width: 32,
//         height: 32,
//         pixels: JSON.stringify([
//           { x: 0, y: 0, color: "#FF5733" },
//           { x: 1, y: 1, color: "#33FF57" },
//         ]),
//       },
//     }),
//     prisma.canvasData.create({
//       data: {
//         projectId: project1.projectId,
//         frameNumber: 2,
//         width: 32,
//         height: 32,
//         pixels: JSON.stringify([
//           { x: 0, y: 1, color: "#5733FF" },
//           { x: 1, y: 0, color: "#FF33A6" },
//         ]),
//       },
//     }),
//     prisma.canvasData.create({
//       data: {
//         projectId: project2.projectId,
//         frameNumber: 1,
//         width: 64,
//         height: 64,
//         pixels: JSON.stringify([
//           { x: 0, y: 0, color: "#FF5733" },
//           { x: 5, y: 5, color: "#3385FF" },
//         ]),
//       },
//     }),
//   ]);

//   // Seed other data (Likes, Comments, Bookmarks, etc.)
//   // ... (same as the previous seed example)

//   // Seed Likes
//   await Promise.all([
//     prisma.like.create({
//       data: {
//         userId: user2.userId,
//         projectId: project1.projectId,
//       },
//     }),
//     prisma.like.create({
//       data: {
//         userId: user1.userId,
//         projectId: project2.projectId,
//       },
//     }),
//   ]);

//   // Seed Comments
//   await Promise.all([
//     prisma.comment.create({
//       data: {
//         userId: user1.userId,
//         projectId: project2.projectId,
//         content: "Amazing work!",
//       },
//     }),
//     prisma.comment.create({
//       data: {
//         userId: user2.userId,
//         projectId: project1.projectId,
//         content: "I love the colors!",
//       },
//     }),
//   ]);

//   // Seed Bookmarks
//   await prisma.bookmark.create({
//     data: {
//       userId: user1.userId,
//       projectId: project2.projectId,
//     },
//   });

//   // Seed Downloads
//   await prisma.download.create({
//     data: {
//       userId: user2.userId,
//       projectId: project1.projectId,
//     },
//   });

//   // Seed Notifications
//   await prisma.notification.create({
//     data: {
//       userId: user1.userId,
//       projectId: project1.projectId,
//       type: "LIKE",
//       message: "Your project received a new like!",
//     },
//   });

//   // Seed Reports
//   await prisma.report.create({
//     data: {
//       reason: "Inappropriate content",
//       user: {
//         connect: { userId: user1.userId },
//       },
//       project: {
//         connect: { projectId: project2.projectId },
//       },
//     },
//   });

//   // Seed Template Layers
//   await prisma.templateLayer.create({
//     data: {
//       projectId: project1.projectId,
//       imageUrl: "https://example.com/template1.png",
//       opacity: 0.5,
//       positionX: 10,
//       positionY: 20,
//       scale: 1.2,
//     },
//   });

//   // Seed Animation Settings
//   await prisma.animationSetting.create({
//     data: {
//       projectId: project1.projectId,
//       frameRate: 15,
//       loop: true,
//       exportFormat: "GIF",
//     },
//   });

//   // Seed Collaboration
//   await prisma.collaboration.create({
//     data: {
//       projectId: project1.projectId,
//       userId: user2.userId,
//       role: "EDITOR",
//     },
//   });

//   // Seed Activity Logs
//   await prisma.activityLog.create({
//     data: {
//       userId: admin.userId,
//       actionType: "DELETE_PROJECT",
//       description: "Deleted a project due to inappropriate content.",
//     },
//   });

//   // Seed Project Versions
//   await prisma.version.create({
//     data: {
//       projectId: project1.projectId,
//       pixels: JSON.stringify([
//         { x: 1, y: 1, color: "#FF5733" },
//         { x: 2, y: 2, color: "#33FF57" },
//       ]),
//     },
//   });

//   console.log("Seeding complete!");
// }

//seed into exsisting users
async function main() {
  // Hash password for users
  const passwordHash = await bcrypt.hash("testing", 10);

  // Retrieve existing users
  const [user1, user2, admin] = await Promise.all([
    prisma.user.findUnique({ where: { username: "jordan" } }),
    prisma.user.findUnique({ where: { username: "janesmith" } }),
    prisma.user.findUnique({ where: { username: "admin" } }),
  ]);

  // Seed additional projects for existing users
  const [project3, project4] = await Promise.all([
    prisma.project.create({
      data: {
        title: "Mountain View",
        description: "Pixel art of a serene mountain view.",
        tags: ["mountain", "view"],
        isPublic: true,
        userId: user1.userId,
      },
    }),
    prisma.project.create({
      data: {
        title: "Space Galaxy",
        description: "A colorful representation of a distant galaxy.",
        tags: ["space", "galaxy"],
        isPublic: false,
        userId: user2.userId,
      },
    }),
  ]);

  // Seed Canvas Data for new projects
  await Promise.all([
    prisma.canvasData.create({
      data: {
        projectId: project3.projectId,
        frameNumber: 1,
        width: 32,
        height: 32,
        pixels: JSON.stringify([
          { x: 0, y: 0, color: "#0000FF" },
          { x: 1, y: 1, color: "#FF0000" },
        ]),
      },
    }),
    prisma.canvasData.create({
      data: {
        projectId: project4.projectId,
        frameNumber: 1,
        width: 64,
        height: 64,
        pixels: JSON.stringify([
          { x: 0, y: 0, color: "#00FF00" },
          { x: 5, y: 5, color: "#FFFF00" },
        ]),
      },
    }),
  ]);

  // Seed additional Likes, Comments, Bookmarks, etc., for existing users
  await Promise.all([
    prisma.like.create({
      data: {
        userId: user2.userId,
        projectId: project3.projectId,
      },
    }),
    prisma.comment.create({
      data: {
        userId: user1.userId,
        projectId: project4.projectId,
        content: "This is truly inspiring!",
      },
    }),
    prisma.bookmark.create({
      data: {
        userId: user2.userId,
        projectId: project3.projectId,
      },
    }),
    prisma.download.create({
      data: {
        userId: user1.userId,
        projectId: project4.projectId,
      },
    }),
  ]);

  // Seed additional notifications
  await prisma.notification.create({
    data: {
      userId: user1.userId,
      projectId: project3.projectId,
      type: "COMMENT",
      message: "Someone commented on your project!",
    },
  });

  // Seed additional reports
  await prisma.report.create({
    data: {
      reason: "Violates guidelines",
      user: {
        connect: { userId: user2.userId },
      },
      project: {
        connect: { projectId: project4.projectId },
      },
    },
  });

  // Seed additional activity logs for admin
  await prisma.activityLog.create({
    data: {
      userId: admin.userId,
      actionType: "BAN_USER",
      description: "Banned a user for violating guidelines.",
    },
  });

  await prisma.templateLayer.create({
    data: {
      projectId: "26850587-ad2b-4261-84aa-c4548615cc63", // Replace with an actual projectId or set it dynamically
      predefinedImages: ["https://example.com/template1.png"],
    },
  });

  console.log("Additional data seeded successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
