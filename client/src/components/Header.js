import { useState } from 'react';
import {
    Navbar,
    NavbarToggler,
    Collapse,
    Nav,
    NavItem,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    Container,
    Row,
    Col
} from 'reactstrap';
import { NavLink } from 'react-router-dom';
import ChartMenu from '../features/chartMenu/ChartMenu';
import './Header.css';
import ContactForm from '../features/contact/ContactForm';
import Icon from './Icon';

const Header = () => {
    const [dropdownOpen, setdropdownOpen] = useState(false);
    const [topNavOpen, setTopNavOpen] = useState(false);
    const [bottomNavOpen, setBottomNavOpen] = useState(false);

    return (
        <Container fluid>
            <Row>
                <Col>
                    <Navbar dark expand='md' id='topNav'>
                        <NavbarToggler onClick={() => setTopNavOpen(!topNavOpen)} />
                        <Collapse isOpen={topNavOpen} navbar>
                            <Nav className='ms-auto' navbar>
                                <NavItem>
                                    <NavLink className='nav-link p-3' to='/'><Icon name='home' /> Home</NavLink>
                                </NavItem>
                            </Nav>
                            <ContactForm />
                        </Collapse>
                    </Navbar>
                </Col>
            </Row>
            <Row style={{backgroundColor: "#c3bee5"}}>
                <Col>
                    <div className='d-flex justify-content-center' expand='md' id='mainTitle'>
                        <h1>Music Historeum</h1>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Navbar dark expand='md' id='bottomNav'>
                        <NavbarToggler onClick={() => setBottomNavOpen(!bottomNavOpen)} />
                        <Collapse isOpen={bottomNavOpen} navbar>
                            <Nav className='mx-auto' navbar justify='true'>
                                <Dropdown nav
                                    isOpen={dropdownOpen}
                                    toggle={() => setdropdownOpen(!dropdownOpen)}>
                                    <DropdownToggle nav caret className='bottomNavItem'>
                                        Charts
                                    </DropdownToggle>
                                    <DropdownMenu  id='mainDropdown'>
                                        <ChartMenu />
                                    </DropdownMenu>
                                </Dropdown>
                                <NavItem>
                                    <NavLink className='nav-link bottomNavItem' to='/Artists'>
                                        Artists
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className='nav-link bottomNavItem' to='/AnnualTopSongs'>
                                        Top Songs by Year
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className='nav-link bottomNavItem' to='/Features'>
                                        Future Features
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className='nav-link bottomNavItem' to='/About'>
                                        About the Site
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className='nav-link bottomNavItem' to='/Issues'>
                                        Known Issues
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </Collapse>
                    </Navbar>
                </Col>
            </Row>
        </Container>
    )
}

export default Header