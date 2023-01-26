import React, { useMemo, useState, useEffect } from "react";
import Table from '../../components/Table';
import ArtistColumns from "./ArtistColumns";
import { Card, CardBody, CardHeader } from "reactstrap";
import fetchArtistData from '../../services/fetchArtistData';
import ArtistStyles from "./ArtistStyles";
import './ArtistCard.css';
const dayjs = require("dayjs");

function ArtistCard(artist) {
    console.log('ArtistCard: ', artist.artist);
    const columns = useMemo(
        () => ArtistColumns(artist), [artist]
    );

    const [data, setData] = useState([]);
    let hiddenColumns;
    
    const artistTitle = () => {
        hiddenColumns = [];
        return(`${artist.artist} Chart History`);
    };

    useEffect(() => { 
        const fetchData = async () => {
            console.log('Pre Fetch Data:', artist.artist);
            const artistData = await fetchArtistData(artist.artist);
            console.log('Post Fetch Data: ', artistData);
            setData(artistData);
        }

        fetchData();
    }, [artist]);

    return data && (
        <>
        <Card className='artistCard'>
            <CardHeader className='artistHeader'>
                <h1>{artistTitle()}</h1>
            </CardHeader>
            <CardBody className='artistBody'>
                <ArtistStyles>
                    <Table columns={columns} data={data} hiddenColumns={hiddenColumns}/>
                </ArtistStyles>
            </CardBody>
        </Card>
        </>
    );
}

export default ArtistCard;