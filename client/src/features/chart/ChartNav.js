import React, { useState, useLayoutEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col } from "reactstrap";
import { selectSpecificChart } from "../chartMenu/chartsMenusSlice";
import WeekPicker from '../../utils/WeekPicker';
import MonthPicker from '../../utils/MonthPicker';
import YearPicker from '../../utils/YearPicker';
import DecadePicker from '../../utils/DecadePicker';
import { updateCurrentChart, updatePendingDate, updateChartStatus, getUpdateChartState } from '../chart/chartsSlice';
const dayjs = require("dayjs");

const ChartNav = ({chart}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { chartType, chartId, chartTimeframe, chartDate } = chart;
    const thisChart = useSelector(selectSpecificChart(chartType, chartId));
    const checkUpdateChartState = useSelector(getUpdateChartState);
    const [beginningOfChart, setBeginningOfChart] = useState(false);
    const [endOfChart, setEndOfChart] = useState(false);
    const [prevDate, setPrevDate] = useState(null);
    const [nextDate, setNextDate] = useState(null);
    const [picker, setPicker] = useState(<><WeekPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>);

    const getNewChart = (bPrevButton) => {
        console.log('bPrevButton = ', bPrevButton);
        const newDate = bPrevButton ? prevDate : nextDate;
        console.log('newDate = ', newDate);
        dispatch(updatePendingDate(newDate));
        dispatch(updateCurrentChart());
        navigate('/Chart');
    }

    const checkTimeframes = () => {
        console.log('Start of checkTimeFrames: Prev = ', prevDate, ' - Next = ', nextDate);
        switch (chartTimeframe) {
            case 'Week':
                setPicker(<><WeekPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>);
                setNextDate(dayjs(chartDate).add(1,'week').format('YYYY-MM-DD'));
                setPrevDate(dayjs(chartDate).subtract(1,'week').format('YYYY-MM-DD'));
                break;
            case 'Month':
                setPicker(<><MonthPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>);
                setNextDate(dayjs(chartDate).add(1,'month').format('YYYY-MM-DD'));
                setPrevDate(dayjs(chartDate).subtract(1,'month').format('YYYY-MM-DD'));
                break;
            case 'Year':
                setPicker(<><YearPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>);
                setNextDate(dayjs(chartDate).add(1,'year').format('YYYY-MM-DD'));
                setPrevDate(dayjs(chartDate).subtract(1,'year').format('YYYY-MM-DD'));
                break;
            case 'Decade':
                setPicker(<><DecadePicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>);
                setNextDate(dayjs(chartDate).add(10,'year').format('YYYY-MM-DD'));
                setPrevDate(dayjs(chartDate).subtract(10,'year').format('YYYY-MM-DD'));
                break;
            default:
                break;     
        }

        if (nextDate > thisChart.LastDate) {
            setNextDate(null);
            setEndOfChart(true);
            console.log('Found last chart');
        }
        else if (endOfChart) {
            setEndOfChart(false);
            console.log('No longer on last chart')
        }


        if (prevDate < thisChart.FirstDate) {
            setPrevDate(null);
            setBeginningOfChart(true);
            console.log('Found first chart');
        }
        else if (beginningOfChart) {
            setBeginningOfChart(false);
            console.log('No longer on last chart')
        }

        dispatch(updateChartStatus());
        console.log('End of checkTimeFrames: Prev = ', prevDate, ' - Next = ', nextDate);
    }

    // useLayoutEffect(() => {
    //     checkTimeframes();
    //     //console.log('Outside checkTimeFrames: Prev = ', prevDate, ' - Next = ', nextDate);
    // }, []);

    useLayoutEffect(() => {
        checkTimeframes();
        //console.log('Outside checkTimeFrames: Prev = ', prevDate, ' - Next = ', nextDate);
    }, [checkUpdateChartState]);

    return (
        <Container className='chartNavCont'>
            <Row className="row-cols-lg-auto g-3">
                <Col>
                    <Button disabled={beginningOfChart} size='sm' style={{backgroundColor:"#483d8b", color:"white", margin: "5%", boxShadow: "3px 3px 1px rgba(46, 46, 46, 0.62)"}}
                            onClick={ () => getNewChart(true) }>Prev</Button>
                </Col>
                <Col>
                    {picker}
                </Col>
                <Col>
                    <Button disabled={endOfChart} size='sm' style={{backgroundColor:"#483d8b", color:"white", margin: "5%", boxShadow: "3px 3px 1px rgba(46, 46, 46, 0.62)"}}
                            onClick={ () => getNewChart(false) }>Next</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default ChartNav;