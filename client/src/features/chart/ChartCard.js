import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Table from '../../components/Table';
import ChartColumns from "./ChartColumns";
import { Card, CardBody, CardHeader } from "reactstrap";
import fetchChartData from '../../services/fetchChartData';
import ChartStyles from "./ChartStyles";
import { selectChartsMenu } from "../chartMenu/chartsMenusSlice";
import { format } from 'date-fns';
import ChartNav from './ChartNav';
import './ChartCard.css';
const dayjs = require("dayjs");

function ChartCard({chart}) {

    const columns = useMemo(
        () => ChartColumns(chart), [chart]
    );

    const { chartType, chartId, chartTimeframe, chartDate } = chart;
    const [data, setData] = useState([]);
    const chartList = useSelector(selectChartsMenu(chartType));
    const currentChart = chartList.find((curChart) => curChart.ChartId === parseInt(chartId));
    let hiddenColumns;
    
    const chartTitle = () => {
        let formattedDate;
        switch (chartTimeframe) {
            case 'Week':
                formattedDate = format(new Date(dayjs(chartDate)), 'MMMM do, yyyy');
                 hiddenColumns = ['song_id', 'album_id'];
                return(`${currentChart.ChartTitle} for ${chartTimeframe} of ${formattedDate}`);
            case 'Month':
                formattedDate = format(new Date(dayjs(chartDate)), 'MMMM  yyyy');
                hiddenColumns = ['song_id', 'album_id', 'first_date', 'last_date', 'points', 'peak', 'weeks'];
                return(`${currentChart.ChartTitle} of ${formattedDate}`);
            case 'Year':
                formattedDate = format(new Date(dayjs(chartDate)), 'yyyy');
                hiddenColumns = ['song_id', 'album_id', 'first_date', 'last_date', 'points'];
                return(`${currentChart.ChartTitle} of ${formattedDate}`);
            case 'Decade':
                formattedDate = format(new Date(dayjs(chartDate)), 'yyyy');
                hiddenColumns = ['song_id', 'album_id', 'first_date', 'last_date', 'points'];
                return(`${currentChart.ChartTitle} of the ${formattedDate}s`);
            default:
                break;
        }

    };

    useEffect(() => { 
        const fetchData = async () => {
            console.log('Pre Fetch Data:', {chart});
            const chartData = await fetchChartData({chart});
            console.log('Post Fetch Data: ', chartData);
            setData(chartData);
        }

        fetchData();
    }, [chart]);

    return data && (
        <>
        <Card className='chartCard'>
            <CardHeader className='chartHeader'>
                <h1>{chartTitle()}</h1>
            </CardHeader>
            <CardBody className='chartBody'>
                <ChartNav chart={chart}/>
                <ChartStyles>
                    <Table columns={columns} data={data} hiddenColumns={hiddenColumns}/>
                </ChartStyles>
            </CardBody>
        </Card>
        </>
    );
}

export default ChartCard;