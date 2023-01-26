import { Container, Row, Col } from "reactstrap";
import ArtistCard from "../features/artist/ArtistCard";

const testArtist = 'U2';

const ArtistPage = () => {
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='ArtistPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <ArtistCard artist={testArtist} />
                                </Col>
                            </Row>
                        </Container>
                    </section>
                </Col>
            </Row>
        </Container>
    );
};

export default ArtistPage;