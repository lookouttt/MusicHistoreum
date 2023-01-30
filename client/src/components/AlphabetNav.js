import React from "react";
import {
    Navbar, 
    // NavbarBrand,
    // Collapse,
    // NavbarToggler,
    Nav,
    NavItem,
    Dropdown,
    // DropdownItem,
    DropdownToggle,
    DropdownMenu,
    Container,
    Row,
    Col
} from 'reactstrap';
import { NavLink } from 'react-router-dom';

const AlphabetNav = () => {

    const alphaChars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R',
         'S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9','*'];
    
    const AlphaNavItems = () => {
        console.log('Inside AlphaNavItems');
        return (
            <NavItem >
                {alphaChars.map(alphaChar => (<NavLink className='nav-link alphaItem' to='#'>{alphaChar}</NavLink>))}
            </NavItem>
        );
    }

    return (
        <Navbar dark expand='md' id='alphaNav'>
            <Nav navbar>
                <AlphaNavItems />
            </Nav>
        </Navbar>
    );
}

export default AlphabetNav;