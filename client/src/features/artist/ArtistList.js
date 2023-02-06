import React from "react";
import { Card, CardBody, CardHeader } from "reactstrap";
import TopArtistList from "./TopArtistList";
import './ArtistList.css';

function ArtistList() {

    return (
        <>
        <Card className='artistListCard'>
            <CardHeader className='artistListHeader'>
                <h1>All-Time Best Selling Artists</h1>
            </CardHeader>
            <CardBody className='artistListBody'>
                <ul className="topArtistList"><TopArtistList/></ul>
            </CardBody>
        </Card>
        </>
    );
}

export default ArtistList;