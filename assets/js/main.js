let pdfFiles = [];

window.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#fileInput').addEventListener('change', (event) => {
        const files = event.currentTarget.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].type !== 'application/pdf') {
                continue;
            }
            addFile(pdfFiles.length, files[i].name);
            pdfFiles.push(files[i]);
        }
    });

    document.querySelector('#merge').addEventListener('click', () => {
        if (pdfFiles.length < 2) {
            alert('Please select at least 2 PDF files');
            return;
        }
        document.querySelector('#merge').style.display = 'none';
        document.querySelector('#merging').style.display = 'initial';
        let pdfUrls = [];
        for (let i = 0; i < pdfFiles.length; i++) {
            pdfUrls.push(URL.createObjectURL(pdfFiles[i]));
        }
        mergeAllPDFs(pdfUrls).then(() => {
            for (let i = 0; i < pdfUrls.length; i++) {
                URL.revokeObjectURL(pdfUrls[i]);
            }
            document.querySelector('#merge').style.display = 'initial';
            document.querySelector('#merging').style.display = 'none';
        });
    });
});

function addFile(id, filename) {
    if (id === 0) {
        document.querySelector('#nofile').innerHTML = '';
    }
    document.querySelector('#selectedFiles').insertAdjacentHTML('beforeend', `
        <div class="row justify-content-center" id="file${id}">
            <div class="col-6 bg-light gy-2 border rounded-start border-secondary border-2 px-1 filename" id="filename${id}">
                ${filename}
            </div>
            <div class="col-1 gy-2 border border-start-0 border-secondary border-2 text-center hover-gray px-0" onclick="swapAbove(arguments[0])">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="33" fill="currentColor" class="bi bi-arrow-up" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                </svg>
            </div>
            <div class="col-1 gy-2 border border-start-0 border-secondary border-2 text-center hover-gray px-0" onclick="swapBottom(arguments[0])">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="33" fill="currentColor" class="bi bi-arrow-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                </svg>
            </div>
            <div class="col-1 gy-2 border border-start-0 rounded-end border-secondary border-2 text-center hover-red px-0" onclick="removeFile(arguments[0])">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="33" fill="red" class="bi bi-x-lg" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z" />
                    <path fill-rule="evenodd" d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z" />
                </svg>
            </div>
        </div>
    `);
}

function removeFile(event) {
    const id = parseInt(event.currentTarget.parentNode.id.slice(4));
    pdfFiles.splice(id, 1);
    document.querySelector('#file' + pdfFiles.length).remove();
    for (let i = id; i < pdfFiles.length; i++) {
        document.querySelector('#filename' + i).innerHTML = pdfFiles[i].name;
    }
    if (pdfFiles.length === 0) {
        document.querySelector('#nofile').innerHTML = 'No file selected';
    }
}

function swapAbove(event) {
    const id = parseInt(event.currentTarget.parentNode.id.slice(4));
    if (id === 0) {
        return;
    }
    let temp = pdfFiles[id];
    pdfFiles[id] = pdfFiles[id - 1];
    pdfFiles[id - 1] = temp;
    document.querySelector(`#filename${id - 1}`).innerHTML = pdfFiles[id - 1].name;
    document.querySelector(`#filename${id}`).innerHTML = pdfFiles[id].name;
}

function swapBottom(event) {
    const id = parseInt(event.currentTarget.parentNode.id.slice(4));
    if (id === pdfFiles.length - 1) {
        return;
    }
    let temp = pdfFiles[id];
    pdfFiles[id] = pdfFiles[id + 1];
    pdfFiles[id + 1] = temp;
    document.querySelector(`#filename${id}`).innerHTML = pdfFiles[id].name;
    document.querySelector(`#filename${id + 1}`).innerHTML = pdfFiles[id + 1].name;
}

async function mergeAllPDFs(urls) {
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (let i = 0; i < urls.length; i++) {
        const donorPdfBytes = await fetch(urls[i]).then(res => res.arrayBuffer());
        const donorPdfDoc = await PDFLib.PDFDocument.load(donorPdfBytes);
        const docLength = donorPdfDoc.getPageCount();
        for (let j = 0; j < docLength; j++) {
            const [donorPage] = await pdfDoc.copyPages(donorPdfDoc, [j]);
            pdfDoc.addPage(donorPage);
        }
    }
    const pdfBytes = await pdfDoc.save();
    const pad2 = (n) => { return n < 10 ? '0' + n : n }
    const date = new Date();
    const str = date.getFullYear().toString()
        + pad2(date.getMonth() + 1)
        + pad2(date.getDate())
        + pad2(date.getHours())
        + pad2(date.getMinutes())
        + pad2(date.getSeconds());
    downloadBlob(pdfBytes, `merged_pdf_${str}.pdf`, 'application/pdf');
}

function downloadBlob(data, fileName, mimeType) {
    var blob, url;
    blob = new Blob([data], {
        type: mimeType
    });
    url = window.URL.createObjectURL(blob);
    downloadURL(url, fileName);
    setTimeout(function () {
        return window.URL.revokeObjectURL(url);
    }, 1000);
}

function downloadURL(data, fileName) {
    var a;
    a = document.createElement('a');
    a.href = data;
    a.download = fileName;
    document.body.appendChild(a);
    a.style = 'display: none';
    a.click();
    a.remove();
}