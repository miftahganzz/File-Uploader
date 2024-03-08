const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 8080;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "file/");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(6, (err, raw) => {
      if (err) return cb(err);
      cb(null, raw.toString("hex") + path.extname(file.originalname));
    });
  },
});

const upload = multer({ storage: storage });

app.use(express.static("public"));
app.use('/file', express.static(path.join(__dirname, 'file')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.post("/upload", upload.single("file"), (req, res) => {
  const fileName = req.file.filename;
  const fileUrl = `http://${req.hostname}/file/${fileName}`;
  const downloadUrl = `http://${req.hostname}/download/${fileName}`;
  const deleteUrl = `http://${req.hostname}/delete/${fileName}`;

  const fileDetails = {
    fileName: fileName,
    originalName: req.file.originalname,
    size: req.file.size,
    extension: path.extname(req.file.originalname),
    uploadTime: new Date().toISOString(),
  };

  const responseData = {
    fileDetails: fileDetails,
    fileUrl: fileUrl,
    downloadUrl: downloadUrl,
    deleteUrl: deleteUrl,
    message: "File uploaded successfully",
  };
  res.json(responseData);
});

app.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "file", fileName);

  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading file");
      }
    });
  } else {
    res.status(404).send("File not found");
  }
});

app.delete("/delete/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "file", fileName);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        res.status(500).send("Error deleting file");
        return;
      }
      res.send("File deleted successfully");
    });
  } else {
    res.status(404).send("File not found");
  }
});

var options = {
    customSiteTitle: "ITzpire Uploader",
    customfavIcon: "https://i.ibb.co/GphSk0T/upload.png",
    customCss: `.topbar { display: none; }`,
    swaggerOptions: {
      displayRequestDuration: true,
    },
  };

const swaggerDocument = {
  swagger: "2.0",
  info: {
    version: "1.0.0",
    title: "Uploader Docs",
    description: "Docs for Uploader",
    "x-logo": {
      url: "https://i.ibb.co/GphSk0T/upload.png",
      altText: "ITzpire Upload",
    },
  },
  host: "cdn.itzpire.site",
  basePath: "/",
  tags: [{ name: "Upload", description: "Endpoints related to file upload" }],
  paths: {
    "/upload": {
      post: {
        tags: ["Upload"],
        summary: "Upload a file",
        consumes: ["multipart/form-data"],
        parameters: [
          {
            in: "formData",
            name: "file",
            type: "file",
            description: "File to upload",
          },
        ],
        responses: {
          200: {
            description: "File uploaded successfully",
            schema: {
              type: "object",
              properties: {
                fileName: {
                  type: "string",
                  description: "The name of the uploaded file",
                },
                fileUrl: {
                  type: "string",
                  description: "The URL of the uploaded file",
                },
                message: {
                  type: "string",
                  description: "A success message",
                },
              },
            },
          },
        },
      },
    },
    "/download/{fileName}": {
      get: {
        tags: ["Upload"],
        summary: "Download a file",
        parameters: [
          {
            in: "path",
            name: "fileName",
            type: "string",
            required: true,
            description: "The name of the file to download",
          },
        ],
        responses: {
          200: {
            description: "File downloaded successfully",
            schema: {
              type: "file",
            },
          },
          404: {
            description: "File not found",
          },
        },
      },
    },
    "/delete/{fileName}": {
      delete: {
        tags: ["Upload"],
        summary: "Delete a file",
        parameters: [
          {
            in: "path",
            name: "fileName",
            type: "string",
            required: true,
            description: "The name of the file to delete",
          },
        ],
        responses: {
          200: {
            description: "File deleted successfully",
          },
          404: {
            description: "File not found",
          },
        },
      },
    },
  },
  "x-request-time": new Date().toISOString(),
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});