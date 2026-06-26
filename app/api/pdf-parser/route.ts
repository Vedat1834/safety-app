import { NextResponse } from 'next/server';

// Statically require pdf.js to prevent Next.js/Webpack build issues with dynamic imports.
const PDFJS = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

function render_page(pageData: any) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    };

    return pageData.getTextContent(render_options)
        .then(function(textContent: any) {
            let lastY, text = '';
            for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY){
                    text += item.str;
                }  
                else{
                    text += '\n' + item.str;
                }    
                lastY = item.transform[5];
            }            
            return text;
        });
}

async function parsePdf(dataBuffer: Buffer) {
    let ret = {
        numpages: 0,
        numrender: 0,
        info: null,
        metadata: null,
        text: "",
        version: PDFJS.version
    };

    PDFJS.disableWorker = true;
    
    // Get document
    let doc = await PDFJS.getDocument({
        data: new Uint8Array(dataBuffer)
    });
    
    ret.numpages = doc.numPages;

    let metaData = await doc.getMetadata().catch(() => null);
    ret.info = metaData ? metaData.info : null;
    ret.metadata = metaData ? metaData.metadata : null;

    let counter = doc.numPages;
    ret.text = "";

    for (let i = 1; i <= counter; i++) {
        let pageText = await doc.getPage(i)
            .then((pageData: any) => render_page(pageData))
            .catch(() => "");
        ret.text = `${ret.text}\n\n${pageText}`;
    }

    ret.numrender = counter;
    doc.destroy();

    return ret;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Dosya yüklenmedi' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF using the static inline parser
        const data = await parsePdf(buffer);

        return NextResponse.json({
            text: data.text,
            info: data.info,
            pages: data.numpages
        });

    } catch (error: any) {
        console.error("PDF Parsing Error:", error);
        return NextResponse.json({
            error: `PDF İşleme Hatası: ${error.message}`,
            details: error.stack
        }, { status: 500 });
    }
}

