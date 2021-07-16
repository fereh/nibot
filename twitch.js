const qs = require("querystring");
const fetch = require("node-fetch");

// contains registered Twitch app's client id, secret, and redirects list
var client = require("./client.json");
//client.redirect = client.redirects[0];
client.redirect = client.redirects[1]; // DEBUG


// This object would be more useful,
// except `node-fetch` does all the work :/
//
var Remote = function (href) {
	this.href = href;
};
Remote.prototype.fetch = function (path, opt) {
	return fetch(this.href + path, opt);
};
Remote.prototype.post = function (path, body) {
	return this.fetch(path, {
		method: "post",
		body: qs.stringify(body),
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});
};


// Twitch API endpoint wrappers
//
var api = new Remote("https://api.twitch.tv/helix");

api.users = function (accessToken, ids, logins) {

	let uri = "/users";
	let q = "";

	if (ids && ids.length > 0) {
		ids = ids.map(x => "id=" + x);
		q += ids.join("&");
	}
	if (logins && logins.length > 0) {
		logins = logins.map(x => "login=" + x);
		q += logins.join("&");
	}

	if (q.length > 0) {
		uri += "?" + q;
	}

	return this.fetch(uri, {
		headers: {
			"client-id": client.id,
			"authorization": `Bearer ${accessToken}`,
		},
	}).then(res => res.json());
};


// Twitch Auth endpoint wrappers
//
var auth = new Remote("https://id.twitch.tv/oauth2");

auth.redirect = function (scopes, state) {
	return this.href + "/authorize?" + qs.stringify({
		"client_id": client.id,
		"redirect_uri": client.redirect,
		"response_type": "code",
		"scope": scopes,
		"state": state,
		//"force_verify": "true", // DEBUG
	});
};

auth.token = function (authCode) {
	return this.post("/token", {
		"client_id": client.id,
		"client_secret": client.secret,
		"code": authCode,
		"grant_type": "authorization_code",
		"redirect_uri": client.redirect,
	}).then(res => res.json());
};

auth.refresh = function (refreshToken) {
	return this.post("/token", {
		"grant_type": "refresh_token",
		"refresh_token": refreshToken,
		"client_id": client.id,
		"client_secret": client.secret,
	}).then(res => res.json());
};

auth.revoke = function (accessToken) {
	return this.post("/revoke", {
		"client_id": client.id,
		"token": accessToken,
	}).then(res => res.ok);
};

auth.validate = function (accessToken) {
	return this.fetch("/validate", {
		headers: { "authorization": `Bearer ${accessToken}`, },
	}).then(res => res.json());
};

auth.userInfo = function (accessToken) {
	return this.fetch("/userinfo", {
		headers: { "authorization": `Bearer ${accessToken}`, },
	}).then(res => res.json());
}


module.exports = {
	client: client, auth: auth, api: api,
};
