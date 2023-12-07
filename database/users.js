const database = include("database_connection");

async function createUser(postData) {
	let createUserSQL = `
		INSERT INTO user
		(username, email, hashedPassword)
		VALUES
		(:user, :email, :hashedPassword);
	`;

	let params = {
		user: postData.username,
		email: postData.email,
		hashedPassword: postData.hashedPassword,
	};

	try {
		const results = await database.query(createUserSQL, params);

		console.log("Successfully created user");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error inserting user");
		console.log(err);
		return false;
	}
}

async function getUser(postData) {
	let getUserSQL = `
		SELECT user_id, username, email, hashedPassword
		FROM user
		WHERE email = :email;
	`;

	let params = {
		email: postData.email,
	};

	try {
		const results = await database.query(getUserSQL, params);

		console.log("Successfully found user");
		console.log(results[0]);
		return results[0];
	} catch (err) {
		console.log("Error trying to find user");
		console.log(err);
		return false;
	}
}

async function getUserID(postData) {
	let getUserIDSQL = `
		SELECT user_id
		FROM user
		WHERE email = :email;
	`;

	let params = {
		email: postData.email,
	};

	try {
		const results = await database.query(getUserIDSQL, params);

		console.log("Successfully found user");
		console.log(results[0]);
		return results[0];
	} catch (err) {
		console.log("Error trying to find user");
		console.log(err);
		return false;
	}
}

module.exports = {
	createUser,
	getUser,
	getUserID
};
