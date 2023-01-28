import React, { useMemo, useState, useEffect } from "react";
import Table from '../../components/Table';
import ArtistListColumns from "./ArtistListColumns";
import { Card, CardBody, CardHeader } from "reactstrap";
import fetchArtistList from '../../services/fetchArtistList';
import ArtistStyles from "./ArtistStyles";
import './ArtistList.css';

function ArtistList() {

    const columns = useMemo(
        () => ArtistListColumns(), []
    );

    const [data, setData] = useState([]);
    
    useEffect(() => { 
        const fetchData = async () => {
            console.log('Pre Fetch Artist List');
            const artistListData = await fetchArtistList();
            console.log('Post Fetch Artist List');
            setData(artistListData);
        }
        fetchData();
    }, []);

    return data && (
        <>
        <Card className='artistListCard'>
            <CardHeader className='artistListHeader'>
                <h1>Artist List</h1>
            </CardHeader>
            <CardBody className='artistListBody'>
                <ArtistStyles>
                    <Table columns={columns} data={data} />
                </ArtistStyles>
            </CardBody>
        </Card>
        </>
    );
}

export default ArtistList;