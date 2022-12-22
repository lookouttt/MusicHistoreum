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

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setdropdownOpen] = useState(false);
    const [accordionOpen, setAccordionOpen] = useState(false);
    const accordionToggle = (id) => {
      if (accordionOpen === id) {
        setAccordionOpen();
      } else {
        setAccordionOpen(id);
      }
    };

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
                                        <Accordion open={accordionOpen} toggle={accordionToggle}>
                                            <AccordionItem>
                                                <AccordionHeader targetId='1'>
                                                    Songs
                                                </AccordionHeader>
                                                <AccordionBody accordionId='1'>
                                                    <Accordion open={accordionOpen} toggle={accordionToggle}>
                                                        <AccordionItem>
                                                            <AccordionHeader targetId='3'>
                                                                Chart 1
                                                            </AccordionHeader>
                                                            <AccordionBody accordionId='3'>
                                                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
                                                                sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                                                                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                                                                nisi ut aliquip ex ea commodo consequat. 
                                                            </AccordionBody>
                                                        </AccordionItem>
                                                        <AccordionItem>
                                                            <AccordionHeader targetId='4'>
                                                               Chart 2
                                                            </AccordionHeader>
                                                            <AccordionBody accordionId='4'>
                                                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
                                                                sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                                                                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                                                                nisi ut aliquip ex ea commodo consequat. 
                                                            </AccordionBody>
                                                        </AccordionItem>
                                                    </Accordion>
                                                </AccordionBody>
                                            </AccordionItem>
                                            <AccordionItem>
                                                <AccordionHeader targetId='2'>
                                                    Albums
                                                </AccordionHeader>
                                                <AccordionBody accordionId='2'>
                                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
                                                    sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                                                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                                                    nisi ut aliquip ex ea commodo consequat. 
                                                </AccordionBody>
                                            </AccordionItem>
                                        </Accordion>
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