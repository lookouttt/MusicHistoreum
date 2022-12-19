import React, { useMemo, useState, useEffect } from "react";
import Table from '../../components/Table';
import ChartColumns from '../../app/shared/WEEK_SONG_COLUMNS';
import { Card, CardBody, CardHeader } from "reactstrap";
import getTestResponse from '../../services/TestService';

function ChartCard(chart) {

    const columns = useMemo(
        () => ChartColumns, []
    );

    const [data, setData] = useState([]);

    useEffect(() => { 
        const fetchData = async () => {
            const chartData = await getTestResponse();
            setData(chartData);
        }

        fetchData();
    }, []);

    return data && (
        <>
        <Card>
            <CardHeader>
                This is a test
            </CardHeader>
            <CardBody>
                <Table columns={columns} data={data} />
            </CardBody>
        </Card>
        </>
    );
}

export default ChartCard;