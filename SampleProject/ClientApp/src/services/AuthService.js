import { PublicClientApplication } from "@azure/msal-browser";
import { callAPI } from "./CallAPI";
import * as microsoftTeams from "@microsoft/teams-js";

export default class AuthService {

	//SCOPES = ["api://c368ce89-e0ce-49b5-ab47-e4637843b93a/access_as_user", "User.Read", "profile", "Mail.Read"/*, "Team.Create"*/];
	SCOPES = ["api://d8f42aefee31.ngrok.io/c368ce89-e0ce-49b5-ab47-e4637843b93a/access_as_user", "User.Read", "profile", "Mail.Read"/*, "Team.Create"*/];

	msalInstance = null;
	msalAuthService = null;

	lastUserInfo = null;
	userChangedCallback = (user, aadToken, apiToken, graphToken, clientType) => {
		this.lastUserInfo = { user, aadToken, apiToken, graphToken, clientType };
	}

	constructor() {

		this.msalInstance = new PublicClientApplication({
			auth: {
				clientId: process.env.REACT_APP_CLIENT_ID,
				redirectUri: process.env.REACT_APP_REDIRECT_URI
			}
		});
	}

	handleMsalToken = async (accessToken, clientType) => {

		this.localToken = accessToken;

		const { success, result } = await callAPI("/api/loginWithToken", { accessToken: accessToken });

		if (success) {
			this.setUserChanged(result.displayName, accessToken, result.accessToken, result.graphAccessToken, clientType);
			this.cacheServerToken(result.refreshToken, result.tokenExpiry);
		}

		return success;
	}

	signInAADSilent = async () => {

		const accounts = this.msalInstance.getAllAccounts();

		if (accounts.length === 0) {
			return false;
		}

		this.msalInstance.setActiveAccount(accounts[0]);

		const authResult = await this.msalInstance.acquireTokenSilent({
			scopes: this.SCOPES,

		});

		return await this.handleMsalToken(authResult.accessToken, "web");
	}

	signInAADRedirect = () => {
		this.msalInstance.loginRedirect({
			scopes: this.SCOPES,
			redirectStartPage: "/profile"
		});
	}

	signInAADPopup = async () => {
		try {
			const authResult = await this.msalInstance.loginPopup({
				scopes: this.SCOPES
			});

			return await this.handleMsalToken(authResult.accessToken, "web");
		}
		catch (err) {
			console.log("Login failed or interrupted: " + err);
		}
	}

	signInLocal = async (email, password) => {
		const { success, error, result } = await callAPI("/api/loginLocal", {
			email: email,
			password: password
		});

		if (success) {
			this.setUserChanged(result.displayName, null, result.accessToken, null, "web");
			this.cacheServerToken(result.refreshToken, result.tokenExpiry);
		}

		return [success, error];
	}

	signInLocalSilent = async () => {
		const serverToken = this.getServerToken();

		if (!serverToken) {
			return false;
		}

		//Check expiry date of refresh token
		///if (serverToken.expiry) ...

		const { success, error, result } = await callAPI("/api/refreshToken", {
			token: serverToken.refreshToken
		});

		if (success) {
			this.setUserChanged(result.displayName, null, result.accessToken, null, "web");
			this.cacheServerToken(result.refreshToken, result.tokenExpiry);
		}

		return [success, error];
	}

	setUserChanged = (displayName, aadToken, apiToken, graphToken, clientType) => {
		this.userChangedCallback({ displayName: displayName }, aadToken, apiToken, graphToken, clientType);
	}

	signInFromAuthCodeRedirect = async () => {

		try {

			const authResult = await this.msalInstance.handleRedirectPromise();

			if (authResult) {

				return await this.handleMsalToken(authResult.accessToken, "web");
			}
		}
		catch (err) {
			console.log("Login failed or interrupted: " + err);
		}

		return false;
	}

	signInWithTeams = async () => {
		try {

			const result = await this.getTeamsToken();

			console.log("Signed in with Teams");

			return await this.handleMsalToken(result, "teams");
		}
		catch (error) {
			console.log("SAMPLE - ERROR: " + error);
		}

		return false;
	}

	signOut = () => {

		window.sessionStorage.removeItem("server_token");

		const accounts = this.msalInstance.getAllAccounts();

		if (accounts.length === 0) {
			return;
		}

		this.msalInstance.logout({
			postLogoutRedirectUri: "/signin"
		});

		//this.setUserChanged(null, null, "logout");		
	}

	cacheServerToken = (refreshToken, tokenExpiry) => {
		window.sessionStorage.setItem("server_token", JSON.stringify({refreshToken: refreshToken, tokenExpiry: tokenExpiry}));
	}

	getTeamsToken = () => {

		let rejectPromise = null;
		let timeout = null;

		const promise = new Promise((resolve, reject) => {
			rejectPromise = reject;
			microsoftTeams.authentication.getAuthToken({
				successCallback: (token) => {
					window.clearTimeout(timeout);
					resolve(token);
				},
				failureCallback: (reason) => {
					window.clearTimeout(timeout);
					reject(reason);
				}
			})
		});

		timeout = window.setTimeout(() => {
			rejectPromise("Timeout");
		}, 2000);

		return promise;
	}

	getServerToken = () => {
		const json = window.sessionStorage.getItem("server_token");
		if (!json) {
			return null;
		}
		return JSON.parse(json);
	}

	isLoggedIn = () => !!window.sessionStorage.getItem("server_token");

	handlePageLoad = async () => {

		microsoftTeams.initialize();

		if (await this.signInWithTeams()) {
			return;
		}

		if (await this.signInFromAuthCodeRedirect()) {
			return;
		}

		if (await this.signInAADSilent()) {
			return;
		}

		await this.signInLocalSilent();
	}

	setUserChangedCallback = (callback) => {
		this.userChangedCallback = callback;
		if (this.lastUserInfo) {
			callback(this.lastUserInfo.user, this.lastUserInfo.aadToken, this.lastUserInfo.apiToken, this.lastUserInfo.graphToken, this.lastUserInfo.clientType);
		}
	}
}