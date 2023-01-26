import React, { useMemo, useState, useEffect } from "react";
import Table from '../../components/Table';
import ArtistColumns from "./ArtistColumns";
import { Card, CardBody, CardHeader } from "reactstrap";
import fetchArtistData from '../../services/fetchArtistData';
import ArtistStyles from "./ArtistStyles";
import { Chrono } from 'react-chrono';
import './ArtistCard.css';
import { format } from 'date-fns';
const dayjs = require("dayjs");

function ArtistCard(artist) {
    console.log('ArtistCard: ', artist.artist);
    const columns = useMemo(
        () => ArtistColumns(artist), [artist]
    );

    const [items, setItems] = useState([]);

    const [data, setData] = useState();
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
            const tempItems = artistData.map(({ song_title, peak, first_date, weeks, peak_weeks }) => {
                const formattedDate = format(new Date(dayjs(first_date)), 'MMMM yyyy');
                return {
                    title: formattedDate,
                    cardTitle: song_title,
                    cardDetailedText: `This song spent ${weeks} weeks on the chart, peaking at number ${peak} for ${peak_weeks} weeks.`
                }
            });
            setData(artistData);
            console.log('TempItems: ', tempItems);
            setItems(tempItems);
            console.log('items: ', items);
        }

        fetchData();
    }, [artist]);

    return data && (
        <>
        {/* <Card className='artistCard'>
            <CardHeader className='artistHeader'>
                <h1>{artistTitle()}</h1>
            </CardHeader>
            <CardBody className='artistBody'>
                <ArtistStyles>
                    <Table columns={columns} data={data} hiddenColumns={hiddenColumns}/>
                </ArtistStyles>
            </CardBody>
        </Card> */}
        <div style={{ width: "600px", height: "700px" }}>
            <Chrono items={items} mode="VERTICAL" cardHeight={"10px"}     theme={{
      primary: '#5D8FB5',
      secondary: '#4A4A4A',
      cardBgColor: '#a57038',
      cardForeColor: 'white',
      titleColor: 'white',
      titleColorActive: '#ed8b2a',
    }}/>
        </div>
        </>
    );
}

export default ArtistCard;