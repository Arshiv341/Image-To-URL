const fileIn = document.getElementById('fileInput');
const previewBox = document.getElementById('previewBox');
const previewImg = document.getElementById('previewImg');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const clearBtn = document.getElementById('clearBtn');
const makeBlobBtn = document.getElementById('makeBlobBtn');
const uploadBtn = document.getElementById('uploadBtn');
const output = document.getElementById('output');
const resultUrl = document.getElementById('resultUrl');
const openLink = document.getElementById('openLink');
const copyBtn = document.getElementById('copyBtn');

// 🔑 ImgBB API key (Ritik ka)
const API_KEY = "eaf424d695f53b705925bf842242e604";

let currentFile = null;
let currentBlobUrl = null;

function humanFileSize(bytes) {
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return bytes + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

fileIn.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (!f) return clearSelection();
  currentFile = f;
  previewBox.style.display = 'flex';
  previewImg.src = URL.createObjectURL(f);
  fileName.textContent = f.name;
  fileSize.textContent = humanFileSize(f.size);
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  currentBlobUrl = null;
  output.style.display = 'none';
});

clearBtn.addEventListener('click', clearSelection);
function clearSelection() {
  fileIn.value = '';
  currentFile = null;
  previewBox.style.display = 'none';
  previewImg.src = '';
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  output.style.display = 'none';
}

makeBlobBtn.addEventListener('click', () => {
  if (!currentFile) return alert('Pehle image select karo.');
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  currentBlobUrl = URL.createObjectURL(currentFile);
  showResult(currentBlobUrl);
});

uploadBtn.addEventListener('click', async () => {
  if (!currentFile) return alert('Pehle image select karo.');

  const base64 = await readFileAsBase64(currentFile);
  const cleaned = base64.replace(/^data:[^;]+;base64,/, '');

  try {
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    const form = new FormData();
    form.append('key', API_KEY);
    form.append('image', cleaned);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: form,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || JSON.stringify(data));
    const publicUrl = data?.data?.display_url || data?.data?.url;
    if (!publicUrl) throw new Error('No URL returned from ImgBB');
    showResult(publicUrl);
  } catch (err) {
    console.error(err);
    alert('Upload failed — check console for details.\n' + (err.message || err));
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload to ImgBB';
  }
});

function showResult(url) {
  output.style.display = 'block';
  resultUrl.value = url;
  openLink.href = url;
  openLink.textContent = 'Open image in new tab';
}

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultUrl.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy URL'), 1200);
  } catch {
    alert('Cannot copy automatically. Please copy manually.');
  }
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
