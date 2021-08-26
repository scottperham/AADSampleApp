import { PublicClientApplication } from "@azure/msal-browser";
import { callAPI } from "./CallAPI";
import * as microsoftTeams from "@microsoft/teams-js";

export default class AuthService {

	//todo: add a variable into appsettings.json to define the api url
	//SCOPES = ["api://c368ce89-e0ce-49b5-ab47-e4637843b93a/access_as_user", "User.Read", "profile", "Mail.Read"/*, "Team.Create"*/];
	SCOPES = ["api://cb99945910fa.ngrok.io/c368ce89-e0ce-49b5-ab47-e4637843b93a/access_as_user", "User.Read", "profile", "Mail.Read"/*, "Team.Create"*/];

	msalInstance = null;
	msalAuthService = null;

	//initalise the inTeams variable and set it to false - this will change when initaliseTeams function is called, if the page
	//is loaded from within Microsoft Teams

	inTeams = false;

	lastUserInfo = null;
	userChangedCallback = (user, aadToken, apiToken, graphToken, link) => {
		this.lastUserInfo = { user, aadToken, apiToken, graphToken, link };
	}

	//initialise the MSAL client app, ready for sign-in, if required
	//clientID and RedirectURI are defined in .env file
	//todo: move this to config
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

	//if redirect button is pressed on sign-in page, this function is called
	//it will redirect user to Azure AD, using the Code Grant to PKCE flow
	//scopes defined in this file are used
	//will redirect bact to whatever is defined in .env/profile

	signInAADRedirect = () => {
		this.msalInstance.loginRedirect({
			scopes: this.SCOPES,
			redirectStartPage: "/profile"
		});
	}

	//if popup button is pressed on sign-in page, this function is called
	//it will popup a new windows and present the Azure AD sign-in page to the user, using the Code Grant to PKCE flow
	//scopes defined in this file are used
	//will return the accesstoken back to the parent window (signin) or the expection code if failure occurs

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
		//if (serverToken.expiry) ...

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

	//this function will attempt to sign-in using Teams. It calls the getTeamsToken function in this file

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
	}

	cacheServerToken = (refreshToken, tokenExpiry) => {
		window.sessionStorage.setItem("server_token", JSON.stringify({refreshToken: refreshToken, tokenExpiry: tokenExpiry}));
	}

	//this function is used to get the Azure AD Access token using the new Teams SSO flow
	//uses the settings from within the Teams manifest to perform this SSO

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

	//this function initialises the Teams SDK, this is required to pass context and allow the SSO flow to be used in Teams
	//success/failure is returned to the function that called this

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

		//todo: try and improve this if possible. At present this function will return that the page is not open in Teams
		//based on the MicrosoftTeams.initialize function timing out within 2 seconds

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

	//called from index.js (on every page loaded in the client app) - this is where it all starts for authentication in the client app
	//this function will calls the initialiseTeams function and reports back if the page has been opened in Teams or not
	//then it sets the variable inTeams to true to false depending on what is returned by the initaliseTeams function
	//if page is loaded in Teams, then it checks if the config page is being accessed and sets the options appropriately to handle this
	//if it isn't the config page the signinWithTeams function is called, that handles SSO from within Teams
	//if outside of Teams, then the signinlocal or azure ad interactive sign-in options are loaded

	handlePageLoad = async () => {

		try {
			await this.initialiseTeams();
			this.inTeams = true;
		}
		catch {
			this.inTeams = false;
		}

		if (this.inTeams) {

			//Check for config page...
			if (window.location.pathname == "/config") {
				microsoftTeams.settings.registerOnSaveHandler((saveEvent) => {
					microsoftTeams.settings.setSettings({
						//todo: move this to config
						websiteUrl: "https://perham.eu.ngrok.io",
						contentUrl: "https://perham.eu.ngrok.io",
						entityId: "sampleApp",
						suggestedDisplayName: "My New Suggested Tab Name"
					});
					saveEvent.notifySuccess();
				});
				microsoftTeams.settings.setValidityState(true);
			}

			if (await this.signInWithTeams()) {
				//we are in Teams but there was a problem getting sigining in the user
				//do something here with the error
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