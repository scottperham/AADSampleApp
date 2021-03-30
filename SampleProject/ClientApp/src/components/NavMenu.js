import React, { useState, useContext } from 'react';
import { ButtonToggle, Collapse, Container, DropdownItem, DropdownMenu, DropdownToggle, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, UncontrolledDropdown } from 'reactstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';

export function NavMenu() {

    const [collapsed, setCollapsed] = useState(true);
    const { user } = useContext(AuthContext);

    const toggleNavbar = () => {
        setCollapsed(!collapsed);
    }
    
    return (

        <header>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3 navbar-dark bg-dark" light>
                <Container>
                    <NavbarBrand tag={Link} to="/">Sample Project</NavbarBrand>
                    <NavbarToggler onClick={() => toggleNavbar()} className="mr-2" />
                    <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                        <ul className="navbar-nav flex-grow">
                            <NavItem>
                                <NavLink tag={Link} to="/">Home</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={Link} to="/users">Users</NavLink>
                            </NavItem>
                            
                            {!!user ? (
                                <>
                                    <UncontrolledDropdown nav inNavbar>
                                        <DropdownToggle nav caret>
                                            {user.displayName}
                                        </DropdownToggle>
                                        <DropdownMenu>
                                            <DropdownItem>
                                                <Link className="nav-link" to="/profile">Profile</Link>
                                            </DropdownItem>
                                            <DropdownItem divider />
                                            <DropdownItem>
                                                <Link className="nav-link" to="/signout">Sign out</Link>
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </UncontrolledDropdown>
                                </>
                            ) : <NavItem><NavLink tag={Link} to="/signin">Sign in</NavLink></NavItem>}
                            
                        </ul>
                    </Collapse>
                </Container>
            </Navbar>
        </header>
    );
}
