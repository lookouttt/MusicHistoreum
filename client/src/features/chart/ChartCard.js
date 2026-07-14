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

function ChartCard({chart, bIncludeNav, pageSize, bPage, bFilter}) {

    const columns = useMemo(
        () => ChartColumns(chart), [chart]
    );
    
    const { chartType, chartId, chartTimeframe, chartDate } = chart;
    const [data, setData] = useState([]);
    const [fetchError, setFetchError] = useState(false);
    const chartList = useSelector(selectChartsMenu(chartType));
    const currentChart = chartList.find((curChart) => curChart.ChartId === parseInt(chartId));

    window.onbeforeunload = () => {
        sessionStorage.setItem('chartType', (chartType==='Song' ? '1' : '2'));
        sessionStorage.setItem('chartId', chartId);
        sessionStorage.setItem('chartTimeframe', (chartTimeframe === 'Week' ? '1' : 
                                                    (chartTimeframe === 'Month' ? '2' : 
                                                    (chartTimeframe === 'Year' ? '3' : '4'))));
        sessionStorage.setItem('chartDate', chartDate);
        sessionStorage.setItem('reloadPage', 'yes');
    }

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
                if (window.innerWidth > 550)
                    hiddenColumns = ['song_id', 'album_id', 'first_date', 'last_date', 'points'];
                else
                    hiddenColumns = ['song_id', 'album_id', 'first_date', 'last_date', 'points', 'peak', 'weeks'];
                return(`${currentChart.ChartTitle} of ${formattedDate}`);
            case 'Decade':
                formattedDate = format(new Date(dayjs(chartDate)), 'yyyy');
                if (window.innerWidth > 550)
                    hiddenColumns = ['song_id', 'album_id', 'first_date', 'last_date', 'points'];
                else
                    hiddenColumns = ['song_id', 'album_id', 'first_date', 'last_date', 'points', 'peak', 'weeks'];
                return(`${currentChart.ChartTitle} of the ${formattedDate}s`);
            default:
                break;
        }

    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const chartData = await fetchChartData({chart});
                setData(chartData);
                setFetchError(false);
            } catch (err) {
                setFetchError(true);
            }
        }

        fetchData();
    }, [chart]);

    if (fetchError) {
        return (
            <Card className='chartCard'>
                <CardBody className='chartBody'>
                    <p>Sorry, this chart couldn't be loaded. Please try again later.</p>
                </CardBody>
            </Card>
        );
    }

    return data && (
        <>
        <Card className='chartCard'>
            <CardHeader className='chartHeader'>
                { bIncludeNav ? <h1>{chartTitle()}</h1> : <h3>{chartTitle()}</h3> }
            </CardHeader>
            <CardBody className='chartBody'>
                { bIncludeNav && <ChartNav chart={chart}/> }
                <ChartStyles>
                    <Table
                        columns={columns}
                        data={data}
                        hiddenColumns={hiddenColumns}
                        tablePageSize={pageSize}
                        bPage={bPage}
                        bFilter={bFilter}
                    />
                </ChartStyles>
            </CardBody>
        </Card>
        </>
    );
}

export default ChartCard;