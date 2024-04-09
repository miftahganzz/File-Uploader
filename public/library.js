const fileList = document.getElementById('file-list');

window.addEventListener('DOMContentLoaded', () => {
  fetch('/library')
    .then(response => response.json())
    .then(data => {
      data.forEach(file => {
        const item = document.createElement('div');
        item.classList.add('file-item');

        const icon = document.createElement('i');
        icon.classList.add('fas', getFileIcon(file.type));
        item.appendChild(icon);

        const fileName = document.createElement('p');
        fileName.textContent = file.name;
        item.appendChild(fileName);

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => downloadFile(file.name));
        item.appendChild(downloadBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteFile(file.name));
        item.appendChild(deleteBtn);

        fileList.appendChild(item);
      });
    })
    .catch(error => console.error('Error fetching file list:', error));
});

function getFileIcon(fileType) {
  switch (fileType) {
    case 'image':
      return 'fa-file-image';
    case 'video':
      return 'fa-file-video';
    case 'document':
      return 'fa-file-alt';
    case 'pdf':
      return 'fa-file-pdf';
    default:
      return 'fa-file';
  }
}

function downloadFile(fileName) {
  fetch(`/library/download/${fileName}`)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error downloading file:', error));
}

function deleteFile(fileName) {
  fetch(`/library/delete/${fileName}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (response.ok) {
        const fileItem = document.querySelector(`.file-item p[data-name="${fileName}"]`);
        if (fileItem) {
          fileItem.parentElement.remove();
        }
      } else {
        console.error('Error deleting file:', response.statusText);
      }
    })
    .catch(error => console.error('Error deleting file:', error));
}