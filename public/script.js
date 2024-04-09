document.getElementById("fileInput").addEventListener("change", function () {
    const fileLabel = document.getElementById("fileLabel");
    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length > 0) {
        fileLabel.textContent = `File selected: ${fileInput.files[0].name}`;
        showProgressBar();
    } else {
        fileLabel.textContent = "Choose a file or drag it here";
        hideProgressBar();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const dropArea = document.body;

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload();
        }
    });

    fileInput.addEventListener("change", handleFileUpload);
});

function showProgressBar() {
    document.getElementById("progressContainer").classList.remove("hidden");
}

function hideProgressBar() {
    document.getElementById("progressContainer").classList.add("hidden");
}

function handleFileUpload() {
    const fileLabel = document.getElementById("fileLabel");
    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length > 0) {
        fileLabel.textContent = `File selected: ${fileInput.files[0].name}`;
        showProgressBar();
        displayFileDetails();
    } else {
        fileLabel.textContent = "Choose a file or drag it here";
        hideProgressBar();
    }
}
    
document.getElementById("btnUpload").addEventListener("click", function () {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) {
        return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const expirationTime = document.getElementById("expirationTime").value;
    formData.append("expirationTime", expirationTime);
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload", true);
    xhr.upload.onprogress = function (event) {
        const percent = (event.loaded / event.total) * 100;
        progressBar.style.width = percent + "%";
        progressText.textContent = percent.toFixed(0) + "%";
    };
    xhr.onload = async function () {
        if (xhr.status === 200) {
            await Swal.fire({
                icon: "success",
                title: "Success",
                text: "File uploaded successfully",
            });
            displayFileDetails(JSON.parse(xhr.responseText));
        } else {
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to upload file",
            });
        }
    };
    xhr.onerror = async function () {
        await Swal.fire({
            icon: "error",
            title: "Error",
            text: "An error occurred while uploading file",
        });
    };
    xhr.send(formData);
});

function displayFileDetails(responseData) {
    const fileDetails = responseData.fileDetails;
    const fileUrl = responseData.fileUrl;
    const downloadUrl = responseData.downloadUrl;
    const deleteUrl = responseData.deleteUrl;
    const totalFiles = responseData.totalFiles;
    const totalGB = responseData.totalGB;

    const details = document.getElementById("details");
    details.innerHTML = `
        <p>File Name: ${fileDetails.fileName}</p>
        <hr />
        <p>Original Name: ${fileDetails.originalName}</p>
        <hr />
        <p>File Size: ${formatBytes(fileDetails.size)}</p>
        <hr />
        <p>Extension: ${fileDetails.extension}</p>
        <hr />
        <p>Upload Time: ${new Date(fileDetails.uploadTime).toLocaleString()}</p>
    `;

    const fileDetailsContainer = document.getElementById("fileDetails");
    fileDetailsContainer.classList.remove("hidden");
    fileDetailsContainer.classList.add("animate__animated", "animate__fadeIn");

    const urlContainer = document.querySelector(".url-container");
    urlContainer.classList.remove("hidden");
    const fileValue = document.getElementById("fileValue");
    const downloadValue = document.getElementById("downloadValue");
    const deleteValue = document.getElementById("deleteValue");
    const totalFileValue = document.getElementById("totalFileValue");
    const totalGBValue = document.getElementById("totalGBValue");
    fileValue.textContent = fileUrl;
    downloadValue.textContent = downloadUrl;
    deleteValue.textContent = deleteUrl;
    totalFileValue.textContent = totalFiles;
    totalGBValue.textContent = totalGB;

    const preview = document.getElementById("preview");
    preview.innerHTML = "";
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (file) {
        const imageTypes = ["image/jpeg", "image/png", "image/gif"];
        if (imageTypes.includes(file.type)) {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.alt = "File Preview";
            img.className = "max-w-full h-auto mx-auto";
            preview.appendChild(img);
        } else {
            const fileType = document.createElement("p");
            fileType.textContent = `File Type: ${file.type}`;
            preview.appendChild(fileType);
        }
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function copyToClipboard(valueId) {
    const value = document.getElementById(valueId).textContent;
    try {
        navigator.clipboard.writeText(value);
        Swal.fire({
            icon: "success",
            title: "Copied!",
            text: "URL copied to clipboard",
        });
    } catch (error) {
        console.error("Error copying to clipboard:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to copy URL to clipboard",
        });
    }
}

document.getElementById("btnCopyFile").addEventListener("click", () => copyToClipboard("fileValue"));
document.getElementById("btnCopyDownload").addEventListener("click", () => copyToClipboard("downloadValue"));
document.getElementById("btnCopyDelete").addEventListener("click", () => copyToClipboard("deleteValue"));

// Fetch file info
fetch('/file-info')
  .then(response => response.json())
  .then(data => {
    const fileInfoContainer = document.getElementById('fileInfo');

    fileInfoContainer.innerHTML = `Total files: ${data.totalFiles}, Total size: ${data.totalSize}`;
  })
  .catch(error => {
    console.error('Error fetching file info:', error);
  });