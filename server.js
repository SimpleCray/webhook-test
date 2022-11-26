const RC = require('ringcentral');
var http = require('http');
require('dotenv').config();

PORT = 5000;
DELIVERY_ADDRESS = 'https://api-officeshed5000-org.ap.ngrok.io/webhook';

var server = http.createServer(function (req, res) {
    console.log(`---------server receiving request: ${req.url}`);
    if (req.method == 'POST') {
        console.log(`---------server receiving post request: ${req.url}`);
        if (req.url == '/webhook') {
            if (req.headers.hasOwnProperty('validation-token')) {
                res.setHeader('Content-type', 'application/json');
                res.setHeader('Validation-Token', req.headers['validation-token']);
                res.statusCode = 200;
                res.end();
            } else {
                var body = [];
                req.on('data', function (chunk) {
                    console.log('---------req.on data');
                    console.log(req.body);
                    body.push(chunk);
                }).on('end', function () {
                    body = Buffer.concat(body).toString();
                    console.log(body);
                    var jsonObj = JSON.parse(body);
                    console.log('---------jsonObj.body');
                    console.log(jsonObj.body);
                });
            }
        }
    } else {
        console.log('IGNORE OTHER METHODS');
    }
});
server.listen(PORT);
console.log(`---------server started on port: ${PORT}`);

var rcsdk = new RC({
    server: process.env.RC_SERVER_URL,
    appKey: process.env.RC_CLIENT_ID,
    appSecret: process.env.RC_CLIENT_SECRET,
});
var platform = rcsdk.platform();
console.log(`---------flatform login`);
platform.login({
    username: process.env.RC_USERNAME,
    password: process.env.RC_PASSWORD,
    // extension: process.env.RC_EXTENSION,
});

platform.on(platform.events.loginSuccess, function (e) {
    console.log('Login success');
    subscribe_for_notification();
});

async function subscribe_for_notification() {
    console.log(`---------subscribe_for_notification`);
    var params = {
        eventFilters: [
            // '/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS',
            // '/restapi/v1.0/account/~/extension/~/telephony/sessions',
            // '/restapi/v1.0/account/~/extension/~/incoming-call-pickup',
            // '/restapi/v1.0/account/~/extension/~/telephony/sessions?direction=Inbound',
            '/restapi/v1.0/account/~/telephony/sessions',
        ],
        deliveryMode: {
            transportType: 'WebHook',
            address: DELIVERY_ADDRESS,
        },
    };
    try {
        var resp = await platform.post('/restapi/v1.0/subscription', params);
        var jsonObj = await resp.json();
        console.log(`---------109f4cc9-b657-445b-a05b-47bc3fedfe3a: ${jsonObj.id}`);
        console.log('Ready to receive incoming SMS and call via WebHook.');
    } catch (e) {
        console.error(e.message);
        throw e;
    }
}
