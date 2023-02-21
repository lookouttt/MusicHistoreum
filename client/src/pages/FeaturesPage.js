import { Container, Row, Col, Card, CardHeader, CardBody, List } from "reactstrap";

const FeaturesPage = () => {
    if (sessionStorage.getItem('reloadPage') === 'yes') {
        sessionStorage.clear();
    }
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='FeaturesPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <Card id='features-card'>
                                        <CardHeader>
                                            <h1 id="features-title">
                                                Future Features
                                            </h1>
                                        </CardHeader>
                                        <CardBody id='features-content'>
                                            <h3>This growing list includes the following:</h3>
                                            <List>
                                                <li>
                                                    Add search and filtering capability for charts
                                                </li>
                                                <li>
                                                    Include additional information for songs, albums, and artists
                                                </li>
                                                <li>
                                                    Allow users to login and create/store custom charts
                                                </li>
                                                <li>
                                                    Allow users to listen to songs and/or create playlists to use with 
                                                    their local music library or online streaming services
                                                </li>
                                                <li>
                                                    Add a blog with interesting facts about chart history.
                                                </li>
                                            </List>
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

export default FeaturesPage;