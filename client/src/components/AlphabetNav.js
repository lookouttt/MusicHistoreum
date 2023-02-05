import React, { useState } from "react";
import {
    Navbar, 
    Nav,
    NavItem,
} from 'reactstrap';
import { NavLink } from 'react-router-dom';
import './AlphabetNav.css';
import ArtistModal from "./ArtistModal";

const AlphabetNav = () => {

    const [passChar, setPassChar] = useState(null)

    const alphaChars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R',
         'S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9','*'];
    
    const AlphaNavItems = () => {
        console.log('Inside AlphaNavItems');
        return (
            <NavItem >
                {alphaChars.map(alphaChar => (<NavLink className='nav-link alphaItem' to='#' onClick={() => setPassChar(alphaChar)}>{alphaChar}</NavLink>))}
            </NavItem>
        );
    }

    return (
        <Navbar dark expand='md' id='alphaNav'>
            <Nav navbar className='mx-auto'>
                <AlphaNavItems />
            </Nav>
            <ArtistModal passChar={passChar} resetPassChar={() => setPassChar(null)}/>
        </Navbar>
    );
}

export default AlphabetNav;