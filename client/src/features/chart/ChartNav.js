import React from "react";
import { useSelector } from "react-redux";
import { Button, Container, Row, Col } from "reactstrap";
import { selectSpecificChart } from "../chartMenu/chartsMenusSlice";
import WeekPicker from '../../utils/WeekPicker';
import MonthPicker from '../../utils/MonthPicker';
import YearPicker from '../../utils/YearPicker';
import DecadePicker from '../../utils/DecadePicker';

const ChartNav = ({chart}) => {
    const { chartType, chartId, chartTimeframe } = chart;
    const thisChart = useSelector(selectSpecificChart(chartType, chartId));
    let picker;
    switch (chartTimeframe) {
        case 'Week':
            picker = <><WeekPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        case 'Month':
            picker = <><MonthPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        case 'Year':
            picker = <><YearPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        case 'Decade':
            picker = <><DecadePicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        default:
            break;     
    }

    return (
        <Container className='chartNavCont'>
            <Row className="row-cols-lg-auto g-3">
                <Col>
                    <Button color='primary' size='sm'>Prev</Button>
                </Col>
                <Col>
                    {picker}
                </Col>
                <Col>
                    <Button color='primary' size='sm'>Next</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default ChartNav;