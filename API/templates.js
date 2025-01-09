const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../controllers/s3Client");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

//<---------- Handles Template Layer Routes ---------->

//create a template layer for a project -- WORKS
router.post(
  "/projects/:projectId/template-layer",
  isLoggedIn,
  upload.single("file"), //multer middleware for single file upload
  async (req, res, next) => {
    const { projectId } = req.params;
    const {
      opacity,
      isLocked,
      positionX,
      positionY,
      scale,
      flipHorizontal,
      flipVertical,
      rotation,
    } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add template layers to this project.",
        });
      }

      //define S3 upload parameters
      const s3Params = {
        Bucket: "pixelit-templates-pfp",
        Key: `templates/${projectId}/${Date.now()}_${file.originalname}`, //unique key for each upload
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      //upload file to S3
      await s3.send(new PutObjectCommand(s3Params));
      const imageUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;

      const templateLayer = await prisma.templateLayer.create({
        data: {
          projectId,
          imageUrl,
          opacity: parseFloat(opacity),
          isLocked: isLocked === "true",
          positionX: parseInt(positionX, 10),
          positionY: parseInt(positionY, 10),
          scale: parseFloat(scale),
          flipHorizontal: flipHorizontal === "true",
          flipVertical: flipVertical === "true",
          rotation: parseInt(rotation, 10),
        },
      });

      res.status(201).json(templateLayer);
    } catch (error) {
      console.error("Error creating template layer:", error.message);
      next(error);
    }
  }
);

//updates template layer for a project -- WORKS
router.patch(
  "/projects/:projectId/template-layer/:layerId",
  isLoggedIn,
  upload.single("file"), //allow optional file upload
  async (req, res, next) => {
    const { layerId, projectId } = req.params;
    const {
      opacity,
      isLocked,
      positionX,
      positionY,
      scale,
      flipHorizontal,
      flipVertical,
      rotation,
    } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    try {
      //check if the layer exists and belongs to a project owned by the user
      const templateLayer = await prisma.templateLayer.findUnique({
        where: { templateLayerId: layerId },
        include: { project: true },
      });

      if (!templateLayer || templateLayer.project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this template layer." });
      }

      let imageUrl = templateLayer.imageUrl;

      //if a new file is uploaded, upload it to S3 and update the URL
      if (file) {
        //delete old file from S3
        if (templateLayer.imageUrl) {
          const oldKey = templateLayer.imageUrl.split("/").slice(-3).join("/");
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: oldKey,
            })
          );
        }

        //upload new file to S3
        const s3Params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `templates/${projectId}/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await s3.send(new PutObjectCommand(s3Params));
        imageUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;
      }

      const updatedTemplateLayer = await prisma.templateLayer.update({
        where: { templateLayerId: layerId },
        data: {
          imageUrl,
          opacity: parseFloat(opacity),
          isLocked: isLocked === "true",
          positionX: parseInt(positionX, 10),
          positionY: parseInt(positionY, 10),
          scale: parseFloat(scale),
          flipHorizontal: flipHorizontal === "true",
          flipVertical: flipVertical === "true",
          rotation: parseInt(rotation, 10),
        },
      });

      res.json(updatedTemplateLayer);
    } catch (error) {
      console.error("Error updating template layer:", error.message);
      next(error);
    }
  }
);

//deletes template layer for a project -- WORKS
router.delete(
  "/projects/:projectId/template-layer/:layerId",
  isLoggedIn,
  async (req, res, next) => {
    const { layerId, projectId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the layer exists and belongs to a project owned by the user
      const templateLayer = await prisma.templateLayer.findUnique({
        where: { templateLayerId: layerId },
        include: { project: true },
      });

      if (!templateLayer || templateLayer.project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this template layer." });
      }

      //if imageUrl exists, delete the image file from S3
      if (
        templateLayer.imageUrl &&
        templateLayer.imageUrl.includes("s3.amazonaws.com")
      ) {
        const templateKey = `templates/${projectId}/${templateLayer.imageUrl
          .split("/")
          .slice(-1)}`; //extract only the file name, append to projectId folder

        const s3Params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: templateKey,
        };
        await s3.send(new DeleteObjectCommand(s3Params));
        console.log(`Template file deleted from S3: ${templateKey}`);
      }

      await prisma.templateLayer.delete({
        where: { templateLayerId: layerId },
      });

      res.status(204).json({ message: "Template successfully deleted." });
    } catch (error) {
      console.error("Error deleting template layer:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->
