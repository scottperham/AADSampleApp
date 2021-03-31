import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ authService, children }) {

	const [authContext, setAuthContext] = useState({
		user: null,
		aadToken: null,
		apiToken: null,
		graphToken: null,
		clientType: "web"
	});

	const userChangeCallback = (user, aadToken, apiToken, graphToken, clientType) => {
		setAuthContext({
			user: user,
			aadToken: aadToken,
			apiToken: apiToken,
			graphToken: graphToken,
			clientType: clientType
		});
	}

	useEffect(() => {
		authService.setUserChangedCallback(userChangeCallback);
	}, []);

	const context = {
		authService: authService,
		user: authContext.user,
		aadToken: authContext.aadToken,
		apiToken: authContext.apiToken,
		graphToken: authContext.graphToken,
		clientType: authContext.clientType
	}

	return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}