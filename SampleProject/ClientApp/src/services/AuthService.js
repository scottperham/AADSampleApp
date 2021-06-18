import { PublicClientApplication } from "@azure/msal-browser";
import { callAPI } from "./CallAPI";
import * as microsoftTeams from "@microsoft/teams-js";

export default class AuthService {

	//SCOPES = ["api://c368ce89-e0ce-49b5-ab47-e4637843b93a/access_as_user", "User.Read", "profile", "Mail.Read"/*, "Team.Create"*/];
	SCOPES = ["api://cb99945910fa.ngrok.io/c368ce89-e0ce-49b5-ab47-e4637843b93a/access_as_user", "User.Read", "profile", "Mail.Read"/*, "Team.Create"*/];

	msalInstance = null;
	msalAuthService = null;

	inTeams = false;

	lastUserInfo = null;
	userChangedCallback = (user, aadToken, apiToken, graphToken, link) => {
		this.lastUserInfo = { user, aadToken, apiToken, graphToken, link };
	}

	constructor() {

		this.msalInstance = new PublicClientApplication({
			auth: {
				clientId: process.env.REACT_APP_CLIENT_ID,
				redirectUri: process.env.REACT_APP_REDIRECT_URI
			}
		});
	}

	handleMsalToken = async (accessToken) => {

		this.localToken = accessToken;

		const { success, result } = await callAPI("/api/loginWithToken", { accessToken: accessToken });

		if (success) {

			if (result.requireLink) {
				this.setUserChanged(result.displayName, accessToken, null, null, true);
			}
			else {
				this.setUserChanged(result.displayName, accessToken, result.accessToken, result.graphAccessToken);
				this.cacheServerToken(result.refreshToken, result.tokenExpiry);
			}
		}

		return success;
	}

	linkIdentity = async (accessToken, link) => {
		this.localToken = accessToken;

		const { success, result } = await callAPI("/api/linkWithIdentity", { accessToken: accessToken, link: link });

		if (success) {
			this.setUserChanged(result.displayName, accessToken, result.accessToken, result.graphAccessToken);
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

		return await this.handleMsalToken(authResult.accessToken);
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

			return await this.handleMsalToken(authResult.accessToken);
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
			this.setUserChanged(result.displayName, null, result.accessToken, null);
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
			this.setUserChanged(result.displayName, null, result.accessToken, null);
			this.cacheServerToken(result.refreshToken, result.tokenExpiry);
		}

		return [success, error];
	}

	setUserChanged = (displayName, aadToken, apiToken, graphToken, link) => {
		this.userChangedCallback({ displayName: displayName }, aadToken, apiToken, graphToken, link);
	}

	signInFromAuthCodeRedirect = async () => {

		try {

			const authResult = await this.msalInstance.handleRedirectPromise();

			if (authResult) {

				return await this.handleMsalToken(authResult.accessToken);
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

			return await this.handleMsalToken(result);
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

		return new Promise((resolve, reject) => {
			microsoftTeams.authentication.getAuthToken({
				successCallback: (token) => {
					resolve(token);
				},
				failureCallback: (reason) => {
					reject(reason);
				}
			})
		});
	}

	initialiseTeams = () => {
		let rejectPromise = null;
		let timeout = null;

		const promise = new Promise((resolve, reject) => {
			rejectPromise = reject;
			microsoftTeams.initialize(() => {
					window.clearTimeout(timeout);
					resolve(true);
				}
			)
		});

		timeout = window.setTimeout(() => {
			rejectPromise("Teams Initialise Timeout");
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

		try {
			await this.initialiseTeams();
			this.inTeams = true;
		}
		catch {
			this.inTeams = false;
		}

		//alert(window.location.pathname);

		if (this.inTeams) {

			//Check for config page...
			if (window.location.pathname == "/config") {
				microsoftTeams.settings.registerOnSaveHandler((saveEvent) => {
					microsoftTeams.settings.setSettings({
						websiteUrl: "https://cb99945910fa.ngrok.io",
						contentUrl: "https://cb99945910fa.ngrok.io",
						entityId: "sampleApp",
						suggestedDisplayName: "My New Suggested Tab Name"
					});
					saveEvent.notifySuccess();
				});
				microsoftTeams.settings.setValidityState(true);
			}

			if (await this.signInWithTeams()) {
				return;
			}
		}
		else {

			if (await this.signInFromAuthCodeRedirect()) {
				return;
			}

			if (await this.signInAADSilent()) {
				return;
			}

			await this.signInLocalSilent();
		}
	}

	setUserChangedCallback = (callback) => {
		this.userChangedCallback = callback;
		if (this.lastUserInfo) {
			callback(this.lastUserInfo.user, this.lastUserInfo.aadToken, this.lastUserInfo.apiToken, this.lastUserInfo.graphToken, this.lastUserInfo.link);
		}
	}
}