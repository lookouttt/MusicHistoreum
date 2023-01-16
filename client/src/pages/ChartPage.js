import { useSelector } from 'react-redux';
import { Container, Row, Col } from "reactstrap";
import ChartCard from "../features/chart/ChartCard";
import { selectCurrentChart } from "../features/chart/chartsSlice";
import '../App.css';


const ChartPage = () => {
    const currentChart = useSelector(selectCurrentChart);

    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='ChartPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <ChartCard chart={currentChart} />
                                </Col>
                            </Row>
                        </Container>
                    </section>
                </Col>
            </Row>
        </Container>
    );
};

export default ChartPage;
