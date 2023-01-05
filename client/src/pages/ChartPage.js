import { useSelector } from 'react-redux';
import { Container } from "reactstrap";
import ChartCard from "../features/chart/ChartCard";
import { selectCurrentChart } from "../features/chart/chartsSlice";


const ChartPage = () => {
    const currentChart = useSelector(selectCurrentChart);

    return (
        <Container>
            <ChartCard chart={currentChart} />
        </Container>
    );
};

export default ChartPage;
