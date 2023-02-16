import React from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getTopArtists } from "./artistsSlice";

const TopArtistList = () => {
    const navigate = useNavigate();
    const artistList = useSelector(getTopArtists());

    return (artistList.map((artist, index) => {
        return (
            <li>
            <Link to={`/Artist/${artist.ArtistName}`} 
                key={index}
                className="artistListName"
                onClick={(e) => {
                    e.preventDefault();
                    navigate(`/Artist/${artist.ArtistName}`);
                }}>{artist.DisplayName}</Link>
                </li>)
    }));
    // return <li key={index} className="artistListName"><a href={`/Artist/${artist.ArtistName}`}>{artist.DisplayName}</a></li>

}

export default TopArtistList;