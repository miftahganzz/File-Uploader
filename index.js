const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./file/");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(3, (err, raw) => {
      if (err) return cb(err);
      cb(null, Date.now() + "-" + raw.toString("hex") + path.extname(file.originalname));
    });
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
}).single("file");

app.use(express.static(path.join(__dirname, "public")));
app.use('/file', express.static(path.join(__dirname, 'file')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/galeri", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "library.html"));
});

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(500).send("An error occurred while uploading the file.");
    } else {
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
    }
  });
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

const folderPath = path.join(__dirname, 'file');

app.use((req, res, next) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return next(err);
    }

    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return next(err);
        }

        const modifiedTime = new Date(stats.mtime);
        if (modifiedTime < oneWeekAgo) {
          fs.unlink(filePath, err => {
            if (err) {
              console.error('Error deleting file:', err);
              return next(err);
            }
            console.log('File deleted:', file);
          });
        }
      });
    });
  });

  next();
});

app.get('/file-info', (req, res, next) => {
  let totalFiles = 0;
  let totalSize = 0;

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return next(err);
    }

    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return next(err);
        }

        if (stats.isFile()) {
          totalFiles++;
          totalSize += stats.size;
        }

        if (totalFiles === files.length) {
          res.json({
            totalFiles,
            totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
          });
        }
      });
    });
  });
});

app.get('/library', (req, res, next) => {
  const folderPath = path.join(__dirname, 'file');

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return next(err);
    }

    const fileList = files.map(file => {
      const fileType = getFileType(file);
      return {
        name: file,
        type: fileType
      };
    });

    res.json(fileList);
  });
});

app.get('/library/download/:fileName', (req, res, next) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'file', fileName);

  res.download(filePath, fileName, err => {
    if (err) {
      console.error('Error downloading file:', err);
      return next(err);
    }
  });
});

app.delete('/library/delete/:fileName', (req, res, next) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'file', fileName);

  fs.unlink(filePath, err => {
    if (err) {
      console.error('Error deleting file:', err);
      return next(err);
    }
    res.sendStatus(200);
  });
});

function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
    return 'image';
  } else if (ext === '.mp4' || ext === '.avi' || ext === '.mkv') {
    return 'video';
  } else if (ext === '.doc' || ext === '.docx' || ext === '.txt') {
    return 'document';
  } else if (ext === '.pdf') {
    return 'pdf';
  } else {
    return 'other';
  }
}

app.use(function(req, res, next) {
  res.status(404);
  res.sendFile(__dirname + '/public/404.html');
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
