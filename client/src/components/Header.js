import { useState } from 'react';
import {
    Navbar, 
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

const Header = () => {
    const [dropdownOpen, setdropdownOpen] = useState(false);
    const defaultValue='ABCXYZ';

    return (
        <Container fluid>
            <Row>
                <Col>
                    <Navbar dark expand='md' id='topNav'>
                        <Nav className='ms-auto' navbar>
                            <NavItem>
                                <NavLink className='nav-link fa fa-home p-3' to='/'> Home</NavLink>
                            </NavItem>
                        </Nav>
                        <ContactForm />
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
                    <Navbar expand='md' id='bottomNav'>
                        <Nav className='mx-auto' navbar justify='true'>
                            <Dropdown nav
                                isOpen={dropdownOpen}
                                toggle={() => setdropdownOpen(!dropdownOpen)}>
                                <DropdownToggle nav caret id='bottomNavItems1'>
                                    Charts
                                </DropdownToggle>
                                <DropdownMenu  id='mainDropdown'>
                                    <ChartMenu />
                                </DropdownMenu>
                            </Dropdown>
                            <NavItem>
                                <NavLink className='nav-link' to={`/Artist/${defaultValue}`} id='bottomNavItems2'>
                                    Artists
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink className='nav-link' to='/Features' id='bottomNavItems3'>
                                    Future Features
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink className='nav-link' to='/About' id='bottomNavItems4'>
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