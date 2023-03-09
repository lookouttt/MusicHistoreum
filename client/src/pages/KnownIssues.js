import { Container, Row, Col, Card, CardHeader, CardBody, List } from "reactstrap";

const KnownIssuesPage = () => {
    if (sessionStorage.getItem('reloadPage') === 'yes') {
        sessionStorage.clear();
    }
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='KnownIssuesPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <Card id='issues-card'>
                                        <CardHeader>
                                            <h1 id="issues-title">
                                                Known Issues
                                            </h1>
                                        </CardHeader>
                                        <CardBody id='issues-content'>
                                            <h3>Current site improvements being worked on:</h3>
                                            <List>
                                                <li>
                                                    Artist searching is currently text-based.  text-based searching was used to prove out the 
                                                    search capabilities during the first phase of this project.  Because of the
                                                    prevalence of collaborations in today's popular music, we are working on creating
                                                    proper associations between the song/album data and the artists to properly associate 
                                                    these collaborations to the multiple artists involved.  Once that background data 
                                                    cleaning is complete we will switch to an ID-based searching algorithm.
                                                </li>
                                                <li>
                                                    Include additional information for songs, albums, and artists.
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

export default KnownIssuesPage;