import { Container, Row, Col, Card, CardHeader, CardBody } from "reactstrap";
import '../App.css';

const HomePage = () => {
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='HomePage'>
                        <Container>
                            <Row>
                                <Col>
                                    <Card id='home-card'>
                                        <CardHeader>
                                            <h1 id="home-title">
                                                Welcome to Music Historeum!!
                                            </h1>
                                        </CardHeader>
                                        <CardBody>
                                            <p id="home-content">
                                                If you enjoy music, then this site is for you. Here you can view music chart data from all around 
                                                the world of music. Wondering about the current charts? We've got them here. Been curious what the 
                                                top ten songs were during the week you were born? You can find it here.

                                            <br/>
                                            <br/>
                                                This site is still under contruction and being updated regularly. Check out the Future Features section
                                                to see where we are headed with the site. Feel free to use the contact form to offer any suggestions
                                                or feedback you may have.

                                            <br/>
                                            <br/>
                                                Now, take a look around. Use the Charts menu above to find the chart information you're looking for. we
                                                have weekly chart data for the Top Songs and Top Albums. We also have monthly, yearly, and decade charts 
                                                for those two categoaries as well as for other genre-specific categories. We hope you enjoy the site.
                                            </p>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </Container>
                    </section>
                </Col>
            </Row>
        </Container>
    );
};

export default HomePage;