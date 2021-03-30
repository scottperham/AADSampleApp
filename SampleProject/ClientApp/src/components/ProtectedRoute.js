import React, { useContext } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';

export default function ProtectedRoute({ component, ...rest }) {

    const { authService } = useContext(AuthContext);

    const Component = component;

    return (
        <Route {...rest} render={(props) => {
            return authService.isLoggedIn() ? <Component {...props} /> : <Redirect to={{ pathname: "/signin" }} />
		}} />
    );

}