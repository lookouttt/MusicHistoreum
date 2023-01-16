import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col } from "reactstrap";
import { selectSpecificChart } from "../chartMenu/chartsMenusSlice";
import WeekPicker from '../../utils/WeekPicker';
import MonthPicker from '../../utils/MonthPicker';
import YearPicker from '../../utils/YearPicker';
import DecadePicker from '../../utils/DecadePicker';
import { updateCurrentChart, updatePendingDate } from '../chart/chartsSlice';
const dayjs = require("dayjs");

const ChartNav = ({chart}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { chartType, chartId, chartTimeframe, chartDate } = chart;
    const thisChart = useSelector(selectSpecificChart(chartType, chartId));

    const getNewChart = (chartDate) => {
         dispatch(updatePendingDate(chartDate));
         dispatch(updateCurrentChart());
         navigate('/Chart');
    }

    let picker;
    let prevDate;
    let nextDate;

    switch (chartTimeframe) {
        case 'Week':
            picker = <><WeekPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            nextDate = dayjs(chartDate).add(1,'week').format('YYYY-MM-DD');
            prevDate = dayjs(chartDate).subtract(1,'week').format('YYYY-MM-DD');
            break;
        case 'Month':
            picker = <><MonthPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            nextDate = dayjs(chartDate).add(1,'month').format('YYYY-MM-DD');
            prevDate = dayjs(chartDate).subtract(1,'month').format('YYYY-MM-DD');
            break;
        case 'Year':
            picker = <><YearPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            nextDate = dayjs(chartDate).add(1,'year').format('YYYY-MM-DD');
            prevDate = dayjs(chartDate).subtract(1,'year').format('YYYY-MM-DD');
            break;
        case 'Decade':
            picker = <><DecadePicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            nextDate = dayjs(chartDate).add(10,'year').format('YYYY-MM-DD');
            prevDate = dayjs(chartDate).subtract(10,'year').format('YYYY-MM-DD');
            break;
        default:
            break;     
    }

    return (
        <Container className='chartNavCont'>
            <Row className="row-cols-lg-auto g-3">
                <Col>
                    <Button color='primary' size='sm' onClick={() => getNewChart(prevDate)} >Prev</Button>
                </Col>
                <Col>
                    {picker}
                </Col>
                <Col>
                    <Button color='primary' size='sm' onClick={() => getNewChart(nextDate)} >Next</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default ChartNav;