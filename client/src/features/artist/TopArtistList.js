import React from "react";
import { useSelector } from "react-redux";
import { getTopArtists } from "./artistsSlice";

const TopArtistList = () => {
    const artistList = useSelector(getTopArtists());

    return (artistList.map((artist, index) => {
        return <li key={index} className="artistListName">{artist.DisplayName}</li>
    }));
}

export default TopArtistList;