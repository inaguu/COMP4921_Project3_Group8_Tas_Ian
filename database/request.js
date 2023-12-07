const database = include("database_connection");

async function addFriend(postData) {
	let addFriendSQL = `
	INSERT INTO friend_request (sender_user_id, status, receiver_user_id)
	VALUES (:senderID, 3, :receiverID);
	`;

	let params = {
		senderID: postData.senderID,
		receiverID: postData.receiverID,
	};

	try {
		const results = await database.query(addFriendSQL, params);

		console.log("Successfully sent friend request");
		console.log(results[0]);
		return results[0];
	} catch (err) {
		console.log("Error trying to send friend request");
		console.log(err);
		return false;
	}
}

module.exports = {
	addFriend,
};
