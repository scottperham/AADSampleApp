import React, { createContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

export const AuthContext = createContext(null);

export function AuthProvider({ authService, children }) {

	const [authContext, setAuthContext] = useState({
		user: null,
		mode: "none",
		aadToken: null,
		apiToken: null
	});

	const history = useHistory();

	const userChangeCallback = (user, mode, aadToken, apiToken) => {
		setAuthContext({
			user: user,
			mode: mode,
			aadToken: aadToken,
			apiToken: apiToken
		});

		if (mode == "msal redirect") {
			history.push("/");
		}
	}

	useEffect(() => {
		authService.setUserChangedCallback(userChangeCallback);
	}, []);

	const context = {
		authService: authService,
		user: authContext.user,
		mode: authContext.mode,
		aadToken: authContext.aadToken,
		apiToken: authContext.apiToken
	}

	return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}