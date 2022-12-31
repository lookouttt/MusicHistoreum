import React, { useMemo, useState, useEffect } from "react";
import Table from '../../components/Table';
import ChartColumns from "./ChartColumns";
import { Card, CardBody, CardHeader } from "reactstrap";
import fetchChartData from '../../services/fetchChartData';
import ChartStyles from "./ChartStyles";

function ChartCard({chart}) {

    const columns = useMemo(
        () => ChartColumns(chart), [chart]
    );

    const [data, setData] = useState([]);

    useEffect(() => { 
        const fetchData = async () => {
            const chartData = await fetchChartData({chart});
            console.log(chartData);
            setData(chartData);
        }

        fetchData();
    }, [chart]);

    return data && (
        <>
        <Card>
            <CardHeader>
                This is a test
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