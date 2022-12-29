import { useState } from 'react';
import {
    Navbar, 
    NavbarBrand,
    Collapse,
    NavbarToggler,
    Nav,
    NavItem,
    Dropdown,
    DropdownItem,
    DropdownToggle,
    DropdownMenu,
    Accordion,
    AccordionBody,
    AccordionItem,
    AccordionHeader,
    Container,
    Row,
    Col
} from 'reactstrap';
import { NavLink } from 'react-router-dom';
import ChartMenu from '../features/chartMenu/ChartMenu';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setdropdownOpen] = useState(false);

    return (
        <Container fluid sticky>
            <Row>
                <Col>
                    <Navbar dark expand='md' id='topNav'>
                        <Nav className='ms-auto' navbar>
                            <NavItem>
                                <NavLink className='nav-link' to='/'>
                                    Home
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink className='nav-link' to='/'>
                                    Contact
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink className='nav-link' to='/'>
                                    Search
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </Navbar>
                </Col>
            </Row>
            <Row>
                <Col>
                    <div class='d-flex justify-content-center' expand='md' id='mainTitle'>
                        <h1>Music Historeum</h1>

                    </div>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Navbar expand='md' id='bottomNav'>
                        <Nav className='ms-auto' navbar>
                            <NavItem>
                                <Dropdown nav
                                    isOpen={dropdownOpen}
                                    toggle={() => setdropdownOpen(!dropdownOpen)}>
                                    <DropdownToggle nav caret>
                                        Charts
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <ChartMenu />
                                    </DropdownMenu>
                                </Dropdown>
                                {/* <NavLink className='nav-link' to='/Chart'>
                                    Charts
                                </NavLink> */}
                            </NavItem>
                            <NavItem>
                                <NavLink className='nav-link' to='/Chart'>
                                    Artists
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink className='nav-link' to='/'>
                                    Future Features
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink className='nav-link' to='/'>
                                    About the Site
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </Navbar>
                </Col>
            </Row>
        </Container>
    )
}

export default Header