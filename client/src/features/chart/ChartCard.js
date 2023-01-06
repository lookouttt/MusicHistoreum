import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Table from '../../components/Table';
import ChartColumns from "./ChartColumns";
import { Card, CardBody, CardHeader } from "reactstrap";
import fetchChartData from '../../services/fetchChartData';
import ChartStyles from "./ChartStyles";
import { selectChartsMenu } from "../chartMenu/chartsMenusSlice";
import './ChartCard.css'

function ChartCard({chart}) {

    const columns = useMemo(
        () => ChartColumns(chart), [chart]
    );
    const { chartType, chartId } = chart;
    const [data, setData] = useState([]);
    const chartList = useSelector(selectChartsMenu(chartType));
    const currentChart = chartList.find((curChart) => curChart.ChartId === parseInt(chartId));
    const chartTitle = currentChart.ChartTitle;

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
            <CardHeader>
                <h1>{chartTitle}</h1>
            </CardHeader>
            <CardBody>
                <ChartStyles>
                    <Table columns={columns} data={data} />
                </ChartStyles>
            </CardBody>
        </Card>
        </>
    );
}

export default ChartCard;