require("./utils");
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

const database = include("database_connection");
const db_utils = include("database/db_utils");
const db_users = include("database/users");
const db_events = include("database/events");
const db_request = include("database/request");
// const db_image = include("database/image");
// const url = include("public/js/url");
const success = db_utils.printMySQLVersion();

const base_url = "http://localhost:8080";
const port = process.env.PORT || 8080;

const app = express();

const expireTime = 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const mongodb_host = process.env.MONGODB_REMOTE_HOST;

const node_session_secret = process.env.NODE_SESSION_SECRET;

app.set("view engine", "ejs");

app.use(
	express.urlencoded({
		extended: false,
	})
);

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true&w=majority`,
	crypto: {
		secret: mongodb_session_secret,
	},
});

app.use(
	session({
		secret: node_session_secret,
		store: mongoStore, //default is memory store
		saveUninitialized: false,
		resave: true,
	})
);

app.get("/", (req, res) => {
	res.render("landing_login", {
		error: "none",
	});
});

app.get("/signup", (req, res) => {
	var missingInfo = req.query.missing;
	res.render("signup", {
		missing: missingInfo,
	});
});

app.post("/submituser", async (req, res) => {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;

	var hashedPassword = bcrypt.hashSync(password, saltRounds);

	let success = await db_users.createUser({
		username: username,
		email: email,
		hashedPassword: hashedPassword,
	});
	console.log(username);
	console.log(email);
	console.log(hashedPassword);

	if (success) {
		var results = await db_users.getUser({
			email: email,
			hashedPassword: password,
		});
		req.session.authenticated = true;
		req.session.username = results[0].username;
		req.session.user_id = results[0].user_id;
		req.session.cookie.maxAge = expireTime;
		console.log(results[0].user_id);

		res.redirect("/home");
	} else {
		// res.render("errorMessage", {
		// 	error: "Failed to create user.",
		// });
		console.log("error in creating the user");
	}
});

app.post("/loggingin", async (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	console.log(email);
	console.log(password);

	var results = await db_users.getUser({
		email: email,
	});

	if (results) {
		if (results.length == 1) {
			//there should only be 1 user in the db that matches
			if (bcrypt.compareSync(password, results[0].hashedPassword)) {
				req.session.authenticated = true;
				req.session.username = results[0].username;
				req.session.user_id = results[0].user_id;
				req.session.cookie.maxAge = expireTime;

				res.redirect("/home");
				return;
			} else {
				console.log("invalid password");
			}
		} else {
			console.log(
				"invalid number of users matched: " + results.length + " (expected 1)."
			);
			res.render("landing_login", {
				error: "User and password not found.",
			});
			return;
		}
	} else {
		console.log("user not found");
		//user and password combination not found
		res.render("landing_login", {
			error: "User and password not found.",
		});
	}
});

//does not require session auth - public
app.get("/home", async (req, res) => {
	if (!isValidSession(req)) {
		res.redirect("/signup");
	} else {
		let results = await db_events.getEvents({
			user_id: req.session.user_id,
		});

		if (results) {
			res.render("home", {
				username: req.session.username,
				events: results,
			});
		}
	}
});

app.post("/save-event", async (req, res) => {
	let event_title = req.body.eventTitleInput;
	let event_date = req.body.event_date;
	let event_time = req.body.event_time;
	let user_id = req.session.user_id;

	const date = new Date();

	let day = date.getDate();
	let month = date.getMonth() + 1;
	let year = date.getFullYear();

	let curr_date = `${year}-${month}-${day}`;
	let event_datetime = `${event_date} ${event_time}`;

	let result = await db_events.createEvent({
		title: event_title,
		event_date: event_datetime,
		date_created: curr_date,
		user_id: user_id,
	});

	if (result) {
		res.redirect("/home");
	}
});

app.get("/friend-request", async (req, res) => {
	if (!isValidSession(req)) {
		res.redirect("/signup");
	} else {
		let user_id = req.session.user_id;
		let outgoing = await db_request.getOutgoingReq({
			userID: req.session.user_id,
		});
		console.log(user_id);
		console.log(outgoing);

		res.render("request", {
			username: req.session.username,
			outgoing: outgoing,
		});
	}
});

app.post("/add-friend", async (req, res) => {
	let email = req.body.email;

	let friend_userID = await db_users.getUserID({
		email: email,
	});

	if (friend_userID) {
		console.log(
			"Server: found friend in database: " + friend_userID[0].user_id
		);

		var results = await db_request.addFriend({
			senderID: req.session.user_id,
			receiverID: friend_userID[0].user_id,
		});

		res.redirect("/friend-request");
	} else {
		console.log("Server: Email does not exist in the database.");
		res.redirect("/friend-request");
	}

	// var results = await db_request.addFriend({
	// 	senderID: req.session.user_id,
	// 	receiverID: postData.receiverID,
	// });

	// res.redirect("/friend-request");
});

app.post("/logout", (req, res) => {
	req.session.authenticated = false;
	req.session.destroy();
	res.redirect("/");
});

function isValidSession(req) {
	if (req.session.authenticated) {
		return true;
	}
	return false;
}

function sessionValidation(req, res, next) {
	if (!isValidSession(req)) {
		req.session.destroy();
		res.redirect("/");
		return;
	} else {
		next();
	}
}

app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
	res.status(404);
	res.render("404", {
		auth: req.session.authenticated,
	});
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
});
