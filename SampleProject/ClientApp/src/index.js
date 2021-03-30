import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import AuthService from './services/AuthService';

const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const rootElement = document.getElementById('root');

const authService = new AuthService();

authService.handlePageLoad().then(() => {

    ReactDOM.render(
        <BrowserRouter basename={baseUrl}>
            <App authService={authService } />
        </BrowserRouter>,
        rootElement);

    registerServiceWorker();

});
