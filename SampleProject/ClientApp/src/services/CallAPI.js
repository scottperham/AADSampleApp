export async function callAPI(uri, body, bearerToken) {

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
		const resultText = await response.text();

		if (response.ok) {

			const result = resultText ? JSON.parse(resultText) : {};
			
			return { success: true, error: null, result: result };
		}

		error = resultText;
	}
	catch (ex) {
		error = ex;
	}

	
	return { success: false, error: error, result: null };
}