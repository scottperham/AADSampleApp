import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ authService, children }) {

	const [authContext, setAuthContext] = useState({
		user: null,
		aadToken: null,
		apiToken: null,
		graphToken: null,
		requiresLink: false
	});

	const userChangeCallback = (user, aadToken, apiToken, graphToken, requiresLink) => {
		setAuthContext({
			user: user,
			aadToken: aadToken,
			apiToken: apiToken,
			graphToken: graphToken,
			requiresLink: requiresLink
		});
	}

	useEffect(() => {
		authService.setUserChangedCallback(userChangeCallback);
	}, [authService]);

	const context = {
		authService: authService,
		user: authContext.user,
		aadToken: authContext.aadToken,
		apiToken: authContext.apiToken,
		graphToken: authContext.graphToken,
		requiresLink: authContext.requiresLink
	}

	return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}