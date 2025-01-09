const router = require("express").Router();
module.exports = router;
const { isLoggedIn, mergePixels } = require("../controllers/authController");

const prisma = require("../prisma");

const {
  PutObjectCommand,
  ListObjectsCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const s3 = require("../controllers/s3Client");

//<---------- v Handles Project Routes v ---------->

//get all projects for logged in user -- WORKS
router.get("/projects", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        canvasData: {
          include: {
            layers: true,
          },
        },
        animations: true,
      },
    });

    res.json(projects);
  } catch (error) {
    console.error("Error retrieving projects:", error.message);
    next(error);
  }
});

//get single loggedIn users project
router.get("/projects/:projectId", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.userId;

  try {
    const project = await prisma.project.findMany({
      where: { projectId, userId },
      include: {
        canvasData: {
          include: {
            layers: true,
          },
        },
        animations: true,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or access denied." });
    }

    res.json(project);
  } catch (error) {
    console.error("Error retrieving project:", error.message);
    next(error);
  }
});

//fetch all draft projects for the logged-in user
router.get("/projects/drafts", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const draftProjects = await prisma.project.findMany({
      where: {
        userId,
        isDraft: true, //only fetch projects marked as drafts
      },
      include: {
        canvasData: true, //include all frames for each draft project
      },
    });

    res.json(draftProjects);
  } catch (error) {
    console.error("Error fetching draft projects:", error.message);
    next(error);
  }
});

//create new project/canvas data for logged in user -- NEEDS TESTING
router.post("/projects", isLoggedIn, async (req, res, next) => {
  const { title, description, tags, isPublic, isDraft, width, height, pixels } =
    req.body;
  const userId = req.user.userId;

  try {
    const newProject = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        tags: tags || [],
        isPublic: isPublic || false, //defaults to false if not provided
        isDraft: isDraft || false,
        canvasData: {
          create: {
            frameNumber: 1, //set as the initial frame
            width: width || 32, //default to 32 if not provided
            height: height || 32, //default to 32 if not provided
            pixels: pixels || [], //default to an empty array if not provided
          },
        },
      },
      include: { canvasData: true }, //include canvas data in the response
    });

    //upload to S3 if project is public
    if (isPublic) {
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `projects/${newProject.projectId}/project.json`,
        Body: JSON.stringify(newProject),
        ContentType: "application/json",
      };

      //upload and update fileUrl
      await s3.send(new PutObjectCommand(s3Params));
      const fileUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;

      await prisma.project.update({
        where: { projectId: newProject.projectId },
        data: { fileUrl },
      });

      newProject.fileUrl = fileUrl; //include fileUrl in the response
    }

    res.status(201).json(newProject);
  } catch (error) {
    console.error(
      "Error creating project with canvas settings:",
      error.message
    );
    next(error);
  }
});

//manually upload a project to S3 -- WORKS
router.post(
  "/projects/:projectId/upload",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({
        where: { projectId },
        include: { canvasData: true, animations: true },
      });

      if (!project || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to upload this project." });
      }

      //upload project to S3
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `projects/${projectId}/project.json`,
        Body: JSON.stringify(project),
        ContentType: "application/json",
      };

      await s3.send(new PutObjectCommand(s3Params));
      const fileUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;

      await prisma.project.update({
        where: { projectId },
        data: { fileUrl },
      });

      res.status(200).json({
        message: "Project uploaded successfully.",
        fileUrl,
      });
    } catch (error) {
      console.error("Error uploading project:", error.message);
      next(error);
    }
  }
);

//create a new frame in existing project -- WORKS
router.post(
  "/projects/:projectId/frames",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add a frame to this project.",
        });
      }

      //find the highest existing frame number and increment it by one
      const maxFrame = await prisma.canvasData.findFirst({
        where: { projectId },
        orderBy: { frameNumber: "desc" },
      });

      const newFrameNumber = maxFrame ? maxFrame.frameNumber + 1 : 1; //start with 1 if no frames exist

      //use width and height from the last frame if available, or default if not
      const width = maxFrame?.width || 32;
      const height = maxFrame?.height || 32;

      //create the new frame data entry
      const newFrame = await prisma.canvasData.create({
        data: {
          projectId,
          frameNumber: newFrameNumber,
          pixels: JSON.stringify([]), //start with an empty array for pixels
          width, //inherit project's width and height
          height,
        },
      });

      res.status(201).json({
        message: "Frame added successfully.",
        newFrame,
      });
    } catch (error) {
      console.error("Error adding frame to project:", error.message);
      next(error);
    }
  }
);

//duplicate an existing frame -- WORKS
router.post(
  "/projects/:projectId/frames/:frameNumber/duplicate",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to duplicate a frame in this project.",
        });
      }

      //find the frame to duplicate
      const frameToDuplicate = await prisma.canvasData.findUnique({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
        include: { layers: true },
      });

      if (!frameToDuplicate) {
        return res.status(404).json({ message: "Frame not found." });
      }

      //determine the new frame number by finding the highest current frame number
      const maxFrame = await prisma.canvasData.findFirst({
        where: { projectId },
        orderBy: { frameNumber: "desc" },
      });
      const newFrameNumber = maxFrame ? maxFrame.frameNumber + 1 : 1;

      //create a new frame with duplicated pixel data and same dimensions
      const duplicatedFrame = await prisma.canvasData.create({
        data: {
          projectId,
          frameNumber: newFrameNumber,
          pixels: frameToDuplicate.pixels, //duplicate pixel data
          width: frameToDuplicate.width,
          height: frameToDuplicate.height,
        },
      });

      //duplicate layers of each frame
      const duplicateLayers = await Promise.all(
        frameToDuplicate.layers.map((layer) =>
          prisma.layer.create({
            data: {
              canvasId: duplicatedFrame.canvasId,
              name: layer.name,
              pixels: layer.pixels,
              opacity: layer.opacity,
              isVisible: layer.isVisible,
              zIndex: layer.zIndex,
              isLocked: layer.isLocked,
            },
          })
        )
      );

      res.status(201).json({
        message: "Frame and its layers duplicated successfully.",
        duplicatedFrame,
        duplicateLayers,
      });
    } catch (error) {
      console.error("Error duplicating frame:", error.message);
      next(error);
    }
  }
);

//update project details for logged in user -- WORKS
router.patch("/projects/:projectId", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, tags, isPublic, isDraft, width, height } =
    req.body;
  const userId = req.user.userId;

  try {
    //check if project exists and belongs to the user
    const project = await prisma.project.findUnique({ where: { projectId } });
    if (!project || project.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this project." });
    }

    //update project details (without width/height)
    const updatedProject = await prisma.project.update({
      where: { projectId },
      data: {
        title,
        description,
        tags: tags || project.tags,
        isPublic,
        isDraft,
      },
    });

    //if width or height is provided, update all canvas frames with new dimensions
    if (width || height) {
      await prisma.canvasData.updateMany({
        where: { projectId },
        data: {
          width: width || project.width, //new width if provided, otherwise keep current
          height: height || project.height, //new height if provided, otherwise keep current
        },
      });
    }

    //handle S3 upload if project becomes public
    if (isPublic && !project.isPublic) {
      try {
        const s3Params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `projects/${projectId}/project.json`, //unique path for the project
          Body: JSON.stringify(updatedProject), //convert project data to JSON for upload
          ContentType: "application/json",
        };

        //upload to S3
        await s3.send(new PutObjectCommand(s3Params));
        const fileUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;

        //update project with the file URL
        await prisma.project.update({
          where: { projectId },
          data: { fileUrl },
        });

        //include the file URL in the response
        updatedProject.fileUrl = fileUrl;
      } catch (s3Error) {
        console.error("Error uploading project to S3:", s3Error.message);
        return res.status(500).json({
          message: "Failed to upload project to cloud storage.",
        });
      }
    }

    res.json({
      message: "Project and canvas dimensions updated successfully.",
      updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error.message);
    next(error);
  }
});

//single frame draft managment -- WORKS
router.patch(
  "/projects/:projectId/draft/:frameNumber",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber } = req.params;
    const userId = req.user.userId;
    const { pixels, layers } = req.body;

    try {
      //check if the project exists and belongs to the user
      const existingProject = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!existingProject || existingProject.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to save this project as a draft." });
      }

      //fetch the specific frame data
      const existingFrame = await prisma.canvasData.findUnique({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
        include: { layers: true },
      });

      let updatedPixels;
      if (existingFrame) {
        //merge the existing pixels with the new ones
        updatedPixels = mergePixels(existingFrame.pixels, pixels);

        //update the existing frame with merged pixels
        await prisma.canvasData.update({
          where: {
            projectId_frameNumber: {
              projectId,
              frameNumber: parseInt(frameNumber),
            },
          },
          data: { pixels: updatedPixels },
        });

        //update or create layers
        if (layers && layers.length > 0) {
          for (const layer of layers) {
            if (layer.layerId) {
              //update existing layer
              await prisma.layer.update({
                where: { layerId: layer.layerId },
                data: {
                  name: layer.name,
                  pixels: layer.pixels,
                  opacity: layer.opacity,
                  isVisible: layer.isVisible,
                  zIndex: layer.zIndex,
                  isLocked: layer.isLocked,
                },
              });
            } else {
              //create new layer
              await prisma.layer.create({
                data: {
                  canvasId: existingFrame.canvasId,
                  name: layer.name,
                  pixels: layer.pixels,
                  opacity: layer.opacity,
                  isVisible: layer.isVisible,
                  zIndex: layer.zIndex,
                  isLocked: layer.isLocked,
                },
              });
            }
          }
        }
      } else {
        //create new frame data if it doesn't exist
        updatedPixels = JSON.stringify(pixels);
        const newFrame = await prisma.canvasData.create({
          data: {
            projectId,
            frameNumber: parseInt(frameNumber),
            pixels: updatedPixels,
            width: existingProject.width,
            height: existingProject.height,
          },
        });

        //add new layers if provided
        if (layers && layers.length > 0) {
          await Promise.all(
            layers.map((layer) =>
              prisma.layer.create({
                data: {
                  canvasId: newFrame.canvasId,
                  name: layer.name,
                  pixels: layer.pixels,
                  opacity: layer.opacity,
                  isVisible: layer.isVisible,
                  zIndex: layer.zIndex,
                  isLocked: layer.isLocked,
                },
              })
            )
          );
        }
      }

      res.json({
        message: "Frame updated successfully.",
        updatedFrame: { frameNumber, pixels: updatedPixels },
      });
    } catch (error) {
      console.error("Error updating frame pixels: ", error.message);
      next(error);
    }
  }
);

//save entire project as a draft -- WORKS
router.patch(
  "/projects/:projectId/save-draft",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;
    const { frames } = req.body; //array of frames with new frameNumber and pixels

    try {
      //check if project exists and belongs to the user
      const existingProject = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!existingProject || existingProject.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to save this project as a draft.",
        });
      }

      //iterate over each frame to update frameNumber and pixels
      for (const frame of frames) {
        const { frameNumber, pixels, layers } = frame;

        //check if frame exists
        const existingFrame = await prisma.canvasData.findUnique({
          where: {
            projectId_frameNumber: {
              projectId,
              frameNumber,
            },
          },
          include: { layers: true }, //include layers
        });

        if (existingFrame) {
          //update pixels for existing frame
          const updatedPixels = mergePixels(existingFrame.pixels, pixels);
          await prisma.canvasData.update({
            where: {
              projectId_frameNumber: {
                projectId,
                frameNumber,
              },
            },
            data: { pixels: updatedPixels },
          });

          //handle layers
          if (layers && layers.length > 0) {
            for (const layer of layers) {
              if (layer.layerId) {
                //update existing layer
                await prisma.layer.update({
                  where: { layerId: layer.layerId },
                  data: {
                    name: layer.name,
                    pixels: layer.pixels,
                    opacity: layer.opacity,
                    isVisible: layer.isVisible,
                    zIndex: layer.zIndex,
                    isLocked: layer.isLocked,
                  },
                });
              } else {
                //create new layer
                await prisma.layer.create({
                  data: {
                    canvasId: existingFrame.canvasId,
                    name: layer.name,
                    pixels: layer.pixels,
                    opacity: layer.opacity,
                    isVisible: layer.isVisible,
                    zIndex: layer.zIndex,
                    isLocked: layer.isLocked,
                  },
                });
              }
            }
          }
        } else {
          //create a new frame if it doesn't exist with the given frameNumber
          const newFrame = await prisma.canvasData.create({
            data: {
              projectId,
              frameNumber, // Set new frameNumber directly
              pixels: JSON.stringify(pixels),
              width: existingProject.width,
              height: existingProject.height,
            },
          });

          //add layers for the new frame
          if (layers && layers.length > 0) {
            await Promise.all(
              layers.map((layer) =>
                prisma.layer.create({
                  data: {
                    canvasId: newFrame.canvasId,
                    name: layer.name,
                    pixels: layer.pixels,
                    opacity: layer.opacity,
                    isVisible: layer.isVisible,
                    zIndex: layer.zIndex,
                    isLocked: layer.isLocked,
                  },
                })
              )
            );
          }
        }
      }

      res.json({
        message: "Project draft saved successfully.",
      });
    } catch (error) {
      console.error("Error saving project draft:", error.message);
      next(error);
    }
  }
);

//add a new layer to an existing frame -- WORKS
router.post(
  "/projects/:projectId/frames/:frameNumber/layers",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber } = req.params;
    const { pixels, opacity, isVisible, zIndex, isLocked, name } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add a layer to this frame.",
        });
      }

      //fetch the canvas data for the given frameNumber
      const canvas = await prisma.canvasData.findUnique({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
      });

      if (!canvas) {
        return res.status(404).json({
          message: "Frame not found.",
        });
      }

      const newLayer = await prisma.layer.create({
        data: {
          canvas: {
            connect: { canvasId: canvas.canvasId }, //link to the existing canvas
          },
          pixels: JSON.stringify(pixels), //convert pixels array to JSON
          opacity,
          isVisible,
          zIndex,
          isLocked,
          name,
        },
      });

      res.status(201).json({
        message: "Layer created successfully.",
        newLayer,
      });
    } catch (error) {
      console.error("Error adding layer: ", error.message);
      next(error);
    }
  }
);

//update a existing layer -- WORKS
router.patch(
  "/projects/:projectId/frames/:frameNumber/layers/:layerId",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber, layerId } = req.params;
    const { pixels, opacity, isLocked, zIndex } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this layer." });
      }

      const layer = await prisma.layer.findUnique({ where: { layerId } });
      if (!layer) {
        return res.status(404).json({ message: "Layer not found." });
      }

      //update the layer
      const updatedLayer = await prisma.layer.update({
        where: { layerId },
        data: { pixels, opacity, isLocked, zIndex },
      });

      res.json({ message: "Layer updated successfully.", updatedLayer });
    } catch (error) {
      console.error("Error updating layer:", error.message);
      next(error);
    }
  }
);

//duplicate a layer -- WORKS
router.post(
  "/projects/:projectId/frames/:frameNumber/layers/:layerId/duplicate",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber, layerId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to duplicate a layer in this frame.",
        });
      }

      //fetch the canvas data for the given frameNumber
      const canvas = await prisma.canvasData.findUnique({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
      });

      if (!canvas) {
        return res.status(404).json({
          message: "Frame not found.",
        });
      }

      //find the layer to duplicate
      const layerToDuplicate = await prisma.layer.findUnique({
        where: { layerId },
      });

      if (!layerToDuplicate) {
        return res.status(404).json({
          message: "Layer not found.",
        });
      }

      //find the highest zIndex within the frame's layers
      const maxZIndex = await prisma.layer.aggregate({
        where: { canvasId: canvas.canvasId },
        _max: { zIndex: true },
      });

      const newZIndex = maxZIndex._max.zIndex ? maxZIndex._max.zIndex + 1 : 1;

      //duplicate the layer
      const newLayer = await prisma.layer.create({
        data: {
          canvas: {
            connect: { canvasId: canvas.canvasId }, //link to the existing canvas
          },
          pixels: layerToDuplicate.pixels, //duplicate pixel data
          opacity: layerToDuplicate.opacity,
          isLocked: layerToDuplicate.isLocked,
          zIndex: newZIndex, //increment zIndex for the new layer
          name: layerToDuplicate.name ? `${layerToDuplicate.name} Copy` : null, // Optional name adjustment
          isVisible: layerToDuplicate.isVisible,
        },
      });

      res.status(201).json({
        message: "Layer duplicated successfully.",
        newLayer,
      });
    } catch (error) {
      console.error("Error duplicating layer: ", error.message);
      next(error);
    }
  }
);

//reorder layers -- WORKS
router.patch(
  "/projects/:projectId/frames/:frameNumber/layers/reorder/:canvasId",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber, canvasId } = req.params; //include canvasId
    const { layers } = req.body; //expecting an array of { layerId, zIndex }
    const userId = req.user.userId;

    console.log("Request Layers:", layers);

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to reorder layers for this project.",
        });
      }

      //validate the canvasId
      const canvas = await prisma.canvasData.findUnique({
        where: { canvasId },
        include: { layers: true },
      });

      if (!canvas) {
        return res.status(404).json({ message: "Canvas not found." });
      }

      console.log("Canvas Layers:", canvas.layers);

      //ensure all layerIds belong to this canvas
      const validLayerIds = canvas.layers.map((layer) => layer.layerId);
      for (const { layerId } of layers) {
        if (!validLayerIds.includes(layerId)) {
          return res.status(404).json({
            message: `Layer with ID ${layerId} not found in this canvas.`,
          });
        }
      }

      //update zIndex for each layer
      for (const { layerId, zIndex } of layers) {
        await prisma.layer.update({
          where: { layerId },
          data: { zIndex },
        });
      }

      res.json({ message: "Layers reordered successfully." });
    } catch (error) {
      console.error("Error reordering layers:", error.message);
      next(error);
    }
  }
);

//delete a layer -- WORKS
router.delete(
  "/projects/:projectId/frames/:frameNumber/layers/:layerId",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber, layerId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this layer." });
      }

      const layer = await prisma.layer.findUnique({ where: { layerId } });
      if (!layer) {
        return res.status(404).json({ message: "Layer not found." });
      }

      await prisma.layer.delete({ where: { layerId } });

      res.status(204).json({ message: "Layer successfully deleted." });
    } catch (error) {
      console.error("Error deleting layer:", error.message);
      next(error);
    }
  }
);

//delete entire project -- NEEDS TESTING
router.delete("/projects/:projectId", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.userId;

  try {
    //check if project exists and belongs to the user
    const project = await prisma.project.findUnique({ where: { projectId } });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this project." });
    }

    //remove associated files from S3
    const deleteProjectFiles = async () => {
      try {
        const projectFolder = `projects/${projectId}/`;
        const listedObjects = await s3.send(
          new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME,
            Prefix: projectFolder,
          })
        );

        if (listedObjects.Contents && listedObjects.Contents.length > 0) {
          const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
              Objects: listedObjects.Contents.map((object) => ({
                Key: object.Key,
              })),
            },
          };

          await s3.send(new DeleteObjectsCommand(deleteParams));
          console.log(
            "S3 objects deleted successfully for project:",
            projectId
          );
        }
      } catch (error) {
        console.error("Error deleting project files from S3:", error.message);
      }
    };

    //remove associated template files from S3
    const deleteTemplateFiles = async () => {
      try {
        const templateFolder = `templates/${projectId}/`;
        const listedTemplates = await s3.send(
          new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME,
            Prefix: templateFolder,
          })
        );

        if (listedTemplates.Contents && listedTemplates.Contents.length > 0) {
          const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
              Objects: listedTemplates.Contents.map((object) => ({
                Key: object.Key,
              })),
            },
          };

          await s3.send(new DeleteObjectsCommand(deleteParams));
          console.log(
            "S3 template objects deleted successfully for project:",
            projectId
          );
        }
      } catch (error) {
        console.error("Error deleting template files from S3:", error.message);
      }
    };

    await Promise.all([deleteProjectFiles(), deleteTemplateFiles()]);

    //delete the project and related data
    await prisma.project.delete({
      where: { projectId },
    });

    res
      .status(200)
      .json({ message: "Project and associated data successfully deleted." }); //successfully deleted
  } catch (error) {
    console.error("Error deleting project:", error.message);
    next(error);
  }
});

//delete a single frame from project -- WORKS
router.delete(
  "/projects/:projectId/frames/:frameNumber",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber } = req.params;
    const userId = req.user.userId;

    try {
      //check if project exists and belongs to user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId != userId) {
        return res.status(403).json({
          message: "Unauthorized to delete this frame",
        });
      }

      //check if frame exists
      const frameToDelete = await prisma.canvasData.findUnique({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
      });

      if (!frameToDelete) {
        return res.status(404).json({
          message: "frame not found.",
        });
      }

      //delete specified frame
      const deletedFrame = await prisma.canvasData.delete({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
      });

      res.status(200).json({
        message: "Frame deleted successfully.",
        deletedFrame,
      });
    } catch (error) {
      console.error("Error delteing frame: ", error.message);
      next(error);
    }
  }
);

//<-------------------- ^^^^^^ -------------------->
