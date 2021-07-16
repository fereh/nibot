const crypto = require("crypto");

const twitch = require("./twitch.js");
const chatbot = require("./chatbot.js");

// helpers
function generateToken(byteLength) {
    return crypto.randomBytes(byteLength).toString('base64');
}
function unixTimestamp() {
    return Math.floor(Date.now() / 1000);
}

var sessions = [];

// note: never cleaned up during runtime,
// easier (and faster) just to let old states be
var states = [];

function grantHandler(res, authCode) {

	let session = {};
session.id = generateToken(32);

	// buy the access token
	twitch.auth.token(authCode).then(json => {
		// fetch user data
		session.accessToken = json.access_token;
		session.refreshToken = json.refresh_token;

		twitch.api.users(session.accessToken).then(json => {
			let data = json.data[0];
			session.id = data.id;
			session.login = data.login;
		});

		sessions.push(session);
	});

	res.writeHead(302, {
"Location": "https://twitch.tv",
"Set-Cookie: session.id,
});
	res.end();
}

function redirectHandler(res) {

	let state = generateToken(32);
	let scopes = [ "chat:read", "chat:edit" ];

	res.writeHead(302, {
		"Location": twitch.auth.redirect(scopes.join(" "), state),
	});
	res.end();

	states.push(state);
}

function authorizeHandler(res, url, req) {

	// check for grant request from Twitch
	let params = url.searchParams;
	if (params.has("code") && params.has("scope") && params.has("state")) {
		// lookup state
		let state = params.get("state");
		state = states.find(x => x === state);

		if (state) {
			grantHandler(res, params.get("code"));
			// discard 'scope' param
			return;
		}
	}

	// default to auth redirect
	redirectHandler(res);
}

/*var handlers = {
	"authorize": authorizeHandler,
};*/

function requestHandler(req, res) {
	let url = new URL("http://interface" + req.url);
	/*let op = url.pathname.substring(1).toLowerCase();

	// sanitization
	if (/[^a-z\/]/.test(op)) {
		res.writeHead(400);
		res.end("Bad format\r\n");
		return;
	}

	let handler = handlers[op];
	if (!handler) {
		res.writeHead(404);
		res.end("Not found\r\n");
		return;
	}*/

	let handler = authorizeHandler;
	handler(res, url, req);
}

(function main() {

	const PORT = 3001;
	const http = require("http");
	const server = http.createServer(requestHandler);
	server.listen(PORT);

})();
