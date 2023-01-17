import React, { useState, useEffect } from "react";
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
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(false);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(false);

    const getNewChart = (chartDate) => {
         dispatch(updatePendingDate(chartDate));
         dispatch(updateCurrentChart());
         navigate('/Chart');
    }

    const checkButtons = (newDate) => {
        if (newDate === thisChart.LastDate)
            setNextBtnDisabled(true);
        else 
            setNextBtnDisabled(false);

        if (newDate === thisChart.FirstDate)
            setPrevBtnDisabled(true);
        else
            setPrevBtnDisabled(false);
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

    useEffect(() => { 
        checkButtons(chartDate);
    }, [chart]);

    return (
        <Container className='chartNavCont'>
            <Row className="row-cols-lg-auto g-3">
                <Col>
                    <Button disabled={prevBtnDisabled} color='primary' size='sm' onClick={() => { getNewChart(prevDate); checkButtons(prevDate)}} >Prev</Button>
                </Col>
                <Col>
                    {picker}
                </Col>
                <Col>
                    <Button disabled={nextBtnDisabled} color='primary' size='sm' onClick={() => { getNewChart(nextDate); checkButtons(nextDate)}} >Next</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default ChartNav;