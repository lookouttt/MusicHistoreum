import React from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getTopArtists } from "./artistsSlice";

const TopArtistList = () => {
    const navigate = useNavigate();
    const artistList = useSelector(getTopArtists());

    return (artistList.map((artist, index) => {
        return (
            <li key={index}>
            <Link to={`/Artist/${encodeURIComponent(artist.ArtistName)}`}
                className="artistListName"
                onClick={(e) => {
                    e.preventDefault();
                    navigate(`/Artist/${encodeURIComponent(artist.ArtistName)}`);
                }}>{artist.DisplayName}</Link>
                </li>)
    }));
}

export default TopArtistList;