import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Container, Row, Col } from "reactstrap";
import fetchArtistData from '../../services/fetchArtistData';
import { Chrono } from 'react-chrono';
import './ArtistCard.css';
import { format } from 'date-fns';
const dayjs = require("dayjs");

function ArtistCard(artist) {
    const [songItems, setSongItems] = useState();
    const [albumItems, setAlbumItems] = useState();
    const [fetchError, setFetchError] = useState(false);
    const artistTitle = () => {
        return(`${artist.artist} Chart History`);
    };

    useEffect(() => {
        const fetchData = async () => {
          try {
            const artistSongData = await fetchArtistData(artist.artist, 'songs');
            if (artistSongData != null) {
                const tempSongItems = artistSongData.map(({ song_title, artist_name, peak, first_date, weeks, peak_weeks }) => {
                    const formattedDate = format(new Date(dayjs(first_date)), 'MMM yyyy');
                    const weeksText = (weeks > 1) ? 'weeks' : 'week';
                    const peakText = (peak_weeks > 1) ? 'weeks' : 'week';
    
                    return {
                        title: formattedDate,
                        cardTitle: song_title,
                        cardSubtitle: artist_name,
                        cardDetailedText: `Debuted and spent ${weeks} ${weeksText} on the chart, peaking at number ${peak} for ${peak_weeks} ${peakText}.`
                    }
                });
                setSongItems(tempSongItems);
            }
            else {
                const tempSongItems = () => {
                    return [{
                        cardTitle: 'No songs found'
                    }]
                }
                setSongItems(tempSongItems);
            }


            const artistAlbumData = await fetchArtistData(artist.artist, 'albums');
            if (artistAlbumData != null) {
                const tempAlbumItems = artistAlbumData.map(({ album_title, artist_name, peak, first_date, weeks, peak_weeks }) => {
                    const formattedDate = format(new Date(dayjs(first_date)), 'MMM yyyy');
                    const weeksText = (weeks > 1) ? 'weeks' : 'week';
                    const peakText = (peak_weeks > 1) ? 'weeks' : 'week';
    
                    return {
                        title: formattedDate,
                        cardTitle: album_title,
                        cardSubtitle: artist_name,
                        cardDetailedText: `Debuted and spent ${weeks} ${weeksText} on the chart, peaking at number ${peak} for ${peak_weeks} ${peakText}.`
                    }
                });
                setAlbumItems(tempAlbumItems);
            }
            else {
                const tempAlbumItems = () => {
                    return [{
                        cardTitle: 'No albums found'
                    }]
                }
                setAlbumItems(tempAlbumItems);
            }
            setFetchError(false);
          } catch (err) {
            setFetchError(true);
          }
        }

        fetchData();
    }, [artist.artist]);

    if (fetchError) {
        return (
            <Card className='artistCard'>
                <CardBody className='artistBody'>
                    <p>Sorry, this artist's chart history couldn't be loaded. Please try again later.</p>
                </CardBody>
            </Card>
        );
    }

    return songItems && albumItems && (
        <Card className='artistCard'>
            <CardHeader className='artistHeader'>
                <h1>{artistTitle()}</h1>
            </CardHeader>
            <CardBody className='artistBody'>
                <Container style={{paddingRight: '1vw', paddingLeft: '1vw'}}>
                    <Row>
                        <Col>
                            <Card className='artistContentCard'>
                                <CardHeader className='artistContentHeader'>
                                    <h2>Charted Songs</h2>
                                </CardHeader>
                                <CardBody className='artistContentBody'>
                                    <div style={{ minWidth: "250px", maxWidth: "500px", height: "700px" }}>
                                        <Chrono 
                                            items={songItems} 
                                            mode="VERTICAL" 
                                            cardHeight={100} 
                                            allowDynamicUpdate='true' 
                                            useReadMore
                                            fontSizes={{
                                                title: '0.8rem',
                                                cardTitle: '1rem',
                                                cardSubtitle: '0.9rem',
                                                cardText: '0.7rem',
                                              }}
                                            theme={{
                                                primary: '#ce7f2f',
                                                secondary: '#4A4A4A',
                                                cardBgColor: '#a57038',
                                                cardForeColor: 'white',
                                                titleColor: 'white',
                                                titleColorActive: '#ed8b2a',
                                            }}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col>
                            <Card className='artistContentCard'>
                                <CardHeader className='artistContentHeader'>
                                    <h2>Charted Albums</h2>
                                </CardHeader>
                                <CardBody className='artistContentBody'>
                                    <div style={{ minWidth: "250px", maxWidth: "500px", height: "700px" }}> 
                                        <Chrono 
                                            items={albumItems} 
                                            mode="VERTICAL" 
                                            cardHeight={100} 
                                            allowDynamicUpdate='true' 
                                            useReadMore 
                                            fontSizes={{
                                                title: '0.8rem',
                                                cardTitle: '1rem',
                                                cardSubtitle: '0.9rem',
                                                cardText: '0.7rem',
                                              }}
                                                theme={{
                                                primary: '#ce7f2f',
                                                secondary: '#4A4A4A',
                                                cardBgColor: '#a57038',
                                                cardForeColor: 'white',
                                                titleColor: 'white',
                                                titleColorActive: '#ed8b2a',
                                            }}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </CardBody>
        </Card>
    );
}

export default ArtistCard;