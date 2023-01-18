import { Container, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import ContactForm from '../features/contact/ContactForm';
import './Footer.css';

const Footer = () => {
  return (
    <Container fluid className='site-footer'>
        <Row>
            <Col xs={{ size: 4, offset: 1 }} sm='2' >
                <h5>Links</h5>
                <ul className='list-unstyled' id='footer-links'>
                    <li>
                        <Link className='fa fa-home' to='/'> Home</Link>
                    </li>
                    <li>
                        <Link className='fa fa-address-book' to='/About'> About</Link>
                    </li>
                    <li>
                        <ContactForm />
                    </li>
                </ul>
            </Col>
            <Col sm='6' className='text-center'>
                <h5>Disclaimer</h5>
                    <p>
                        Music Historeum is an indepedently-produced website and has no affiliation with Billboard Magazine or any other published 
                        or broadcast media. Material posted on this site is meant for research, educational, and/or entertainment purposes only.
                    </p>
            </Col>
        </Row>
    </Container>
  )
}

export default Footer
