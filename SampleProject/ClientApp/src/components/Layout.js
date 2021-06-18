import React, { useContext } from 'react';
import { Container } from 'reactstrap';
import { AuthContext } from '../AuthProvider';
import { NavMenu } from './NavMenu';
import Link from './Link';

export function Layout(props) {

    const { authService, requiresLink } = useContext(AuthContext);

    return (
        <div>
            {!authService.inTeams && <NavMenu />}
            {requiresLink && <Link />}
            {!requiresLink && <Container>
                {props.children}
            </Container>}
        </div>
    );

}
