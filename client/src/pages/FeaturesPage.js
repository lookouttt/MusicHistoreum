import { Container, Row, Col } from "reactstrap";

const FeaturesPage = () => {
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section class='mh-background' data-urlType='FeaturesPage'>
                        <div>
                            <h1 id="landing-title">
                                Welcome to the Features Page
                            </h1>
                            <p id="landing-content">
                            Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. 
                            Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. 
                            Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
                            </p>
                        </div>
                    </section>
                </Col>
            </Row>
        </Container>
    );
};

export default FeaturesPage;