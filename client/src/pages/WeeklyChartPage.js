import { Container } from "reactstrap";
import SubHeader from "../components/SubHeader";
import ChartCard from "../features/chart/ChartCard";

const WeeklyChartPage = () => {
    return (
        <Container>
            <SubHeader current='Weekly Chart' />
            <ChartCard />
        </Container>
    );
};

export default WeeklyChartPage;
