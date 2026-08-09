import { Container, Row, Col } from 'reactstrap';
import AnnualTopSongsList from '../features/annualTopSongs/AnnualTopSongsList';
import '../App.css';

const AnnualTopSongsPage = () => {
    return (
        <Container fluid>
            <Row className='justify-content-md-center'>
                <Col>
                    <section className='mh-background' data-urltype='AnnualTopSongsPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <AnnualTopSongsList />
                                </Col>
                            </Row>
                        </Container>
                    </section>
                </Col>
            </Row>
        </Container>
    );
};

export default AnnualTopSongsPage;
