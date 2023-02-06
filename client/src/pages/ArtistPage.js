import { useParams } from "react-router-dom";
import { Container, Row, Col } from "reactstrap";
import ArtistCard from "../features/artist/ArtistCard";
import AlphabetNav from "../components/AlphabetNav";
import ArtistList from '../features/artist/ArtistList';

const ArtistPage = () => {
    const defaultValue = "ABCXYZ"
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
                                    <AlphabetNav />
                                    { artist !== defaultValue ? <ArtistCard artist={artist} /> : <ArtistList />}
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