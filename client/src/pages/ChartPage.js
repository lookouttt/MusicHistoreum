import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col } from "reactstrap";
import ChartCard from "../features/chart/ChartCard";
import { selectCurrentChart, updatePendingId, updatePendingType, updatePendingTimeframe, updatePendingDate, updateCurrentChart } from "../features/chart/chartsSlice";
import '../App.css';


const ChartPage = () => {
    const dispatch = useDispatch();
    if (sessionStorage.getItem('reloadPage') === 'yes') {
        console.log('Getting stored data');
        dispatch(updatePendingId(sessionStorage.getItem('chartId')));
        dispatch(updatePendingDate(sessionStorage.getItem('chartDate')));
        dispatch(updatePendingType(sessionStorage.getItem('chartType')));
        dispatch(updatePendingTimeframe(sessionStorage.getItem('chartTimeframe')));
        dispatch(updateCurrentChart());
        sessionStorage.clear();
    }

    const currentChart = useSelector(selectCurrentChart);
    
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col>
                    <section className='mh-background' data-urltype='ChartPage'>
                        <Container>
                            <Row>
                                <Col>
                                    <ChartCard 
                                        chart={currentChart} 
                                        bIncludeNav={true} 
                                        pageSize={20} 
                                        bPage={true} 
                                        bFilter={true}
                                    />
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
