import { useParams } from "react-router-dom";
import { Container, Row, Col } from "reactstrap";
import ArtistCard from "../features/artist/ArtistCard";

const ArtistPage = () => {
    let { artist } = useParams();
    console.log('Artist Page artist: ', artist);

    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='ArtistPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <ArtistCard artist={artist} />
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