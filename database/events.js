const database = include("database_connection");

async function createEvent(postData) {
	let createEventSQL = `
		INSERT INTO event
		(title, event_date, date_created, user_id)
		VALUES
		(:title, :event_date, :date_created, :user_id);
	`;

	let params = {
		title: postData.title,
		event_date: postData.event_date,
		date_created: postData.date_created,
        user_id: postData.user_id
	};

	try {
		const results = await database.query(createEventSQL, params);
		console.log("Successfully created event");
		console.log(results[0]);
		return true;
	} catch (err) {
		console.log("Error inserting event");
		console.log(err);
		return false;
	}
}

async function getEvents(postData) {
	let getEventsSQL = `
		SELECT title, event_date
        FROM event
        WHERE user_id = :user_id
	`;

	let params = {
        user_id: postData.user_id
	};

	try {
		const results = await database.query(getEventsSQL, params);
		console.log("Successfully grabbed user events");
		console.log(results[0]);
		return results[0];
	} catch (err) {
		console.log("Error grabbing user events");
		console.log(err);
		return false;
	}
}

module.exports = {
	createEvent,
    getEvents
};