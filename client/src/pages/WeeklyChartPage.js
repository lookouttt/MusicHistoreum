import { useSelector } from 'react-redux';
import { Container } from "reactstrap";
import SubHeader from "../components/SubHeader";
import ChartCard from "../features/chart/ChartCard";
import { selectCurrentChart } from "../features/chart/chartsSlice";


const WeeklyChartPage = () => {
    const currentChart = useSelector(selectCurrentChart);

    return (
        <Container>
            {/* <SubHeader current='Weekly Chart' /> */}
            <ChartCard chart={currentChart} />
        </Container>
    );
};

export default WeeklyChartPage;
