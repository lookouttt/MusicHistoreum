import { Container, Row, Col, Card, CardHeader, CardBody, List } from "reactstrap";
import { useNavigate, Link } from "react-router-dom";

const FeaturesPage = () => {
    const navigate = useNavigate();

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
                                                    Enhance searching and filtering capability for charts.
                                                </li>
                                                <li>
                                                    Include additional information for songs, albums, and artists.
                                                </li>
                                                <li>
                                                    Allow users to login and create/store custom charts.
                                                </li>
                                                <li>
                                                    Allow users to listen to songs and/or create playlists to use with 
                                                    their local music library or online streaming services.
                                                </li>
                                                <li>
                                                    Add a blog with interesting facts about chart history.
                                                </li>
                                                <li>
                                                    <Link to={`/Issues`} 
                                                        key={1}
                                                        className="knownIssuesLink"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigate(`/Issues`);
                                                        }}>Known Issues - Click here to take a look at our current list of 
                                                            known issues that we are looking into.
                                                    </Link>
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