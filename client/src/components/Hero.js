//import heroImage from '../app/assets/img/vinyl-1595847.jpg';
import { Row, Col } from "reactstrap";
import './Hero.css';

const Hero = () => {
    return (
        <Row className="justify-content-md-center">
            <Col>
                <section class='hero' >
                    <div>
                        <h1 id="hero-title">
                            Welcome to Music Historeum
                        </h1>
                        <p class="hero-content">
                        Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. 
                        Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. 
                        Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
                        </p>
                    </div>
                </section>
            </Col>
        </Row>
        
    );
}

export default Hero;