export async function callAPI(uri, body, bearerToken, returnType) {

	const request = {
		method: !!body ? "POST" : "GET",
		headers: {
			"Content-Type": "application/json"
		}
	}

	if (body) {
		request["body"] = JSON.stringify(body);
	}

	if (bearerToken) {
		request.headers["Authorization"] = "Bearer " + bearerToken;
	}

	let error = null;

	try {

		const response = await fetch(uri, request);

		if (!response.ok) {
			return { success: false, error: await response.text(), result: null };
		}

		let result = null;

		switch (returnType) {
			case "text":
				result = await response.text();
				break;
			case "blob":
				result = await response.blob();
				break;
			default:
				result = await response.json();
				break;
		}

		return { success: true, error: null, result: result };
	}
	catch (ex) {
		error = ex;
	}

	
	return { success: false, error: error, result: null };
}