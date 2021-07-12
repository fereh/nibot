
var client;
var channels;

const tmi = require("tmi.js");


function commandHandler(channel, tags, message, self) {
	if (self) return;
	//if (tags.username !== "notinterestings") return;

	let args = message.toLowerCase().split(" ");

	switch (args[0]) {
		case "!join":
			channels.push(`#${args[1]}`);
			client.join(`#${args[1]}`);
			break;
		case "!part":
			// TODO: support named channel `part`
			client.part(channels.pop());
			break;

		case "!lurk":
			client.say(channel, `@${tags.username} ` + "would like to let the chat know that he is lurking.");
			break;
		case "!cool":
			client.say(channel, `@${tags.username} ` + "thinks that it's cool.");
			break;
	}
}


function boot(username, password) {

	channels = [ `#${username}` ];

	client = new tmi.Client({
		options: { debug: true, messagesLogLevel: "info" },
		connection: {
			secure: true,
			reconnect: true,
		},
		identity: {
			username: username,
			password: password,
		},
		channels: channels,
	});

	client.on("message", commandHandler);
}

module.exports = {
	connect: (username, password) => {
		boot(username, password);
		client.connect();
	},
	disconnect: () => {
		client.disconnect();
	},
};
