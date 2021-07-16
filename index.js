const crypto = require("crypto");
const storage = require("node-persist");

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
var states = [];

verifyHandler(session) {
twitch.auth.validate(session.accessToken).then(json => {
if (json.status !== 200) {
// test what error response looks like
// twitch.auth.refresh()
}
return true;
});
}

function grantHandler(res, authCode) {

	let session = {};
	session.id = generateToken(32);

	// buy the access token
	twitch.auth.token(authCode).then(json => {
		session.accessToken = json.access_token;
		session.refreshToken = json.refresh_token;

		// associate user info
		twitch.auth.userInfo(session.accessToken).then(json => {

// can redirect now that we know success
res.setHeader("Set-Cookie", [
"Id=" + session.id,
"SameSite=Strict",
"HttpOnly",
"Secure",
]);
res.writeHead(302, { "Location": "https://twitch.tv" });
res.end();

			session.userId = json.sub;
			session.userLogin = json.preferred_username;

			// overwrite existing entry
			let duplicate = sessions.findIndex(x => x.userId === session.userId);
			if (duplicate == -1) {
sessions.push(session);
			}
			else {
twitch.auth.revoke(sessions[duplicate].accessToken);
sessions[duplicate] = session;
			}
				
			writeUsers();
		});
	});

	
}

function redirectHandler(res, state) {

	/*let state = generateToken(32);
	let scopes = [ "chat:read", "chat:edit" ];*/

	res.writeHead(302, {
		"Location": twitch.auth.redirect(
			state.scopes.join(" "), state.id),
	});
	res.end();

	/*states.push(state);*/
}

function authorizeHandler(res, url, grantHandler) {

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

function requestHandler(req, res) {
	let url = new URL("http://interface" + req.url);

	let state = {};
	state.id = generateToken(32);
	state.scopes = [ "chat:read", "chat:edit" ];
	redirectHandler(res, state);
	states.push(state);

}

(function main() {

	const PORT = 3001;
	const http = require("http");
	const server = http.createServer(requestHandler);
	server.listen(PORT);


// todo:
// specify file name, not dir
// make track/sync function
	storage.init({ dir: "./storage", }).then(() => {
		storage.getItem("sessions").then((x) => {
			if (x) {
				sessions = x;
			}
			else {
				storage.setItem("sessions", []);
			}
		});
	});

})();
