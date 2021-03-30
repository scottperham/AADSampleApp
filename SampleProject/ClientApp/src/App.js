import React from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './AuthProvider';

import SignIn from './components/SignIn';
import SignOut from './components/SignOut';
import SignUp from './components/SignUp';
import Users from './components/Users';
import Profile from './components/Profile';

export default function App({ authService }) {

    return (
        <AuthProvider authService={ authService }>
            <Layout>
                <Route exact path='/' component={Home} />
                <Route path='/signin' component={SignIn} />
                <Route path='/signout' component={SignOut} />
                <Route path='/signup' component={SignUp} />
                <ProtectedRoute path='/profile' component={Profile} />
                <ProtectedRoute path='/users' component={Users} />
            </Layout>
        </AuthProvider>
    );
}
