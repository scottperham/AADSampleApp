import React, { useContext } from 'react';
import { Container } from 'reactstrap';
import { AuthContext } from '../AuthProvider';
import { NavMenu } from './NavMenu';

export function Layout(props) {

    const { clientType } = useContext(AuthContext);

    return (
        <div>
            {clientType != "teams" && <NavMenu />}
            <Container>
                {props.children}
            </Container>
        </div>
    );

}
