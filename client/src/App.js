import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';


import HomePage from './pages/HomePage';
import ChartPage from './pages/ChartPage';
import ArtistPage from './pages/ArtistPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import KnownIssuesPage from './pages/KnownIssues';
import fetchChartList from './services/fetchChartList';
import './features/chartMenu/chartsMenusSlice.js'
import { updateLastDate } from './features/chartMenu/chartsMenusSlice.js';
const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

function App() {
    const [dataLoaded, setDataLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const dispatch = useDispatch();

    useEffect (() => {
        const fetchList = async () => {
            try {
                const chartList = await fetchChartList();
                chartList.forEach(chart => {
                    const formattedDate = (dayjs.utc(chart.last_date).format('YYYY-MM-DD'));
                    dispatch(updateLastDate({chartId: chart.chart_id, chartType: chart.chart_type, lastDate: formattedDate}));
                });
                setDataLoaded(true);
            } catch (err) {
                setLoadError(true);
            }
        }
        fetchList();
    }, [dispatch]);

    if (loadError) {
        return (
            <div className="App">
                <p>Sorry, something went wrong loading Music Historeum. Please try again later.</p>
            </div>
        );
    }

    if (!dataLoaded) {
        return (
            <div className="App">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="App">
            <Header />
            <Routes>
                <Route path='/' element={<HomePage />}/>
                <Route path='/Chart' element={<ChartPage />}/>
                <Route path='/Artist/:artist' element={<ArtistPage />}/>
                <Route path='/Features' element={<FeaturesPage />}/>
                <Route path='/About' element={<AboutPage />}/>
                <Route path='/Issues' element={<KnownIssuesPage/>}/>
            </Routes>
            <Footer />
        </div>
    );
}

export default App;
