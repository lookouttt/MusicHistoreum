import React, { useState } from "react";
import {
    Navbar,
    Nav,
    NavItem,
} from 'reactstrap';
import './AlphabetNav.css';
import ArtistModal from "./ArtistModal";

const AlphabetNav = () => {

    const [passChar, setPassChar] = useState(null)

    const alphaChars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R',
         'S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9','*'];

    const AlphaNavItems = () => {
        return (
            <NavItem >
                {alphaChars.map((alphaChar, index) => (<button key={index} type='button' className='nav-link alphaItem' onClick={() => setPassChar(alphaChar)}>{alphaChar}</button>))}
            </NavItem>
        );
    }

    return (
        <Navbar dark id='alphaNav'>
            <Nav navbar className='mx-auto'>
                <AlphaNavItems />
            </Nav>
            <ArtistModal passChar={passChar} resetPassChar={() => setPassChar(null)}/>
        </Navbar>
    );
}

export default AlphabetNav;