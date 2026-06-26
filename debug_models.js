const https = require('https');

const apiKey = "AIzaSyAGiX4xB1WYmQZwhkV8ku5Z4bcbaJ5fjXM";

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${apiKey}`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log(`Listing models...`);

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            const models = json.models || [];

            // Check for 1.5 flash
            const flash15 = models.find(m => m.name.includes('gemini-1.5-flash'));
            console.log("Gemini 1.5 Flash:", flash15 ? flash15.name : "NOT FOUND");

            // Check for Pro
            const pro = models.find(m => m.name.includes('gemini-pro'));
            console.log("Gemini Pro:", pro ? pro.name : "NOT FOUND");

            // Print first 5 models just in case
            console.log("First 5 models:", models.slice(0, 5).map(m => m.name));

        } catch (e) {
            console.log("Error parsing JSON");
        }
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e);
});

req.end();
