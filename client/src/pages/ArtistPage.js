import { useParams } from "react-router-dom";
import { Container, Row, Col } from "reactstrap";
import ArtistCard from "../features/artist/ArtistCard";
import ArtistList from "../features/artist/ArtistList";

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
                                    <ArtistList />
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