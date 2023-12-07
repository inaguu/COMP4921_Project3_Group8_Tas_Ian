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

async function getOutgoingReq(postData) {
	let getOutgoingReqSQL = `
		select username, email
		from friend_request
		join user on (user.user_id = friend_request.receiver_user_id)
		where (
			select sender_user_id
			from friend_request
			join user on (user.user_id = friend_request.sender_user_id)
			where status = 3
		) = :userID
	`;

	let params = {
		userID: postData.userID,
	};

	try {
		const results = await database.query(getOutgoingReqSQL, params);

		console.log("Successfully got list of outgoing friend request");
		console.log(results[0]);
		return results[0];
	} catch (err) {
		console.log("Error trying to get list of outgoing friend request");
		console.log(err);
		return false;
	}
}

module.exports = {
	addFriend,
	getOutgoingReq,
};
