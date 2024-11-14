const router = require("express").Router();
module.exports = router;

const prisma = require("../prisma");

//get public profile information -- WORKS
router.get("/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        bio: true,
        downloadCount: true,
        bookmarkCount: true,
        projects: {
          where: { isPublic: true }, //retrieve only public projects
          select: {
            title: true,
            description: true,
            createdAt: true,
            downloadCount: true,
            bookmarkCount: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    console.error("Error retrieving profile:", error.message);
    next(error);
  }
});
