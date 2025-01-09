const router = require("express").Router();
module.exports = router;
const {
  isLoggedIn,
  createNotification,
  processFrameDownload,
  processExport,
} = require("../controllers/authController");

const prisma = require("../prisma");

const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../controllers/s3Client");

//<---------- Handles Download Activity Routes ---------->

//download and track download activity for a project -- WORKS
router.post(
  "/projects/:projectId/download",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { downloadType, frameNumber, animationId, exportFormat } = req.body; //options for download
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({
        where: { projectId },
        include: { canvasData: true, animations: true },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      //authorization: check if the project is public or owned by the requesting user
      if (!project.isPublic && project.userId !== userId) {
        return res.status(403).json({
          message: "You are not authorized to download this project.",
        });
      }

      //upload to S3 if fileUrl is missing
      if (!project.fileUrl) {
        const s3Params = {
          Bucket: process.env.AWS_BUCKET_NAME, //adjust to your S3 bucket
          Key: `projects/${projectId}/project.json`, //unique path for the project
          Body: JSON.stringify(project), //convert project data to JSON for upload
          ContentType: "application/json",
        };

        //perform S3 upload
        await s3.send(new PutObjectCommand(s3Params));
        const fileUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;

        //update project with the file URL
        await prisma.project.update({
          where: { projectId },
          data: { fileUrl },
        });

        //update the file URL in the project object
        project.fileUrl = fileUrl;
      }

      let downloadContent;

      //handle different download types
      switch (downloadType) {
        case "frame": //download by frame
          const frame = project.canvasData.find(
            (f) => f.frameNumber === frameNumber
          );
          if (!frame) {
            return res.status(404).json({ message: "Frame not found." });
          }
          //process frame download (static image)
          downloadContent = await processFrameDownload(
            frame,
            exportFormat || "PNG"
          );
          break;
        case "animation": //download by animation
          const animation = project.animations.find(
            (a) => a.animationId === animationId
          );
          if (!animation) {
            return res.status(404).json({ message: "Animation not found." });
          }
          //process animation download in desired format
          downloadContent = await processExport(
            animation,
            exportFormat || "GIF"
          );
          break;
        default: //fallback to full project download
          downloadContent = {
            url: project.fileUrl,
            message: "Full project downloaded.",
          };
          break;
      }

      //increment download count (project)
      await prisma.project.update({
        where: { projectId },
        data: { downloadCount: { increment: 1 } },
      });

      //increment download count for the project owner (user)
      await prisma.user.update({
        where: { userId: project.userId },
        data: { downloadCount: { increment: 1 } },
      });

      //log download event in the Download table
      await prisma.download.create({ data: { userId, projectId } });

      //create a notification for the project owner
      await createNotification(
        project.userId, //project owner's ID
        projectId,
        "DOWNLOAD",
        `Your project was downloaded!`
      );

      res.status(200).json({
        message: "Download successful.",
        downloadContent,
      });
    } catch (error) {
      console.error("Error tracking download:", error.message);
      next(error);
    }
  }
);

//user download history --
router.get("/users/:userId/downloads", isLoggedIn, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const downloadHistory = await prisma.download.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            projectId: true,
            title: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { downloadedAt: "desc" },
    });

    res.json(downloadHistory);
  } catch (error) {
    console.error("Error fetching download history:", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->
