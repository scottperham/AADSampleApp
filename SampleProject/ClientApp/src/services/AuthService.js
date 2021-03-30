﻿import { PublicClientApplication } from "@azure/msal-browser";
import { callAPI } from "./CallAPI";

export default class AuthService {

	SCOPES = ["api://c368ce89-e0ce-49b5-ab47-e4637843b93a/access_as_user", "User.Read", "profile", "Mail.Read"];

	msalInstance = null;
	msalAuthService = null;

	lastUserInfo = null;
	userChangedCallback = (user, mode, aadToken, apiToken) => {
		this.lastUserInfo = { user: user, mode: mode, aadToken, apiToken };
	}

	constructor() {

		this.msalInstance = new PublicClientApplication({
			auth: {
				clientId: process.env.REACT_APP_CLIENT_ID,
				redirectUri: process.env.REACT_APP_REDIRECT_URI
			}
		});
	}

	handleMsalToken = async (accessToken, mode) => {

		this.localToken = accessToken;

		const { success, _, result } = await callAPI("/api/loginWithToken", { accessToken: accessToken });

		if (success) {
			this.setUserChanged(result.displayName, mode, accessToken, result.accessToken);
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

		return await this.handleMsalToken(authResult.accessToken, "msal silent");
	}

	signInAADRedirect = () => {
		this.msalInstance.loginRedirect({
			scopes: this.SCOPES
		});
	}

	signInAADPopup = async () => {
		const authResult = await this.msalInstance.loginPopup({
			scopes: this.SCOPES
		});

		return await this.handleMsalToken(authResult.accessToken, "msal popup");
	}

	signInLocal = async (email, password) => {
		const { success, error, result } = await callAPI("/api/loginLocal", {
			email: email,
			password: password
		});

		if (success) {
			this.setUserChanged(result.displayName, "local", null, result.accessToken);
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
			this.setUserChanged(result.displayName, "local silent", null, result.accessToken);
			this.cacheServerToken(result.refreshToken, result.tokenExpiry);
		}

		return [success, error];
	}

	setUserChanged = (displayName, mode, aadToken, apiToken) => {
		this.userChangedCallback({ displayName: displayName }, mode, aadToken, apiToken);
	}

	signInFromAuthCodeRedirect = async () => {
		const authResult = await this.msalInstance.handleRedirectPromise();

		if (authResult) {
			return await this.handleMsalToken(authResult.accessToken, "msal redirect");
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

	getServerToken = () => {
		const json = window.sessionStorage.getItem("server_token");
		if (!json) {
			return null;
		}
		return JSON.parse(json);
	}

	isLoggedIn = () => !!window.sessionStorage.getItem("server_token");

	handlePageLoad = async () => {

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
			callback(this.lastUserInfo.user, this.lastUserInfo.mode, this.lastUserInfo.aadToken, this.lastUserInfo.apiToken);
		}
	}
}