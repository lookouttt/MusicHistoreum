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
    console.log('This is the beginning. Getting chart list data');
    // const [latestChartList, setLatestChartList] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const dispatch = useDispatch();

    useEffect (() => {
        const fetchList = async () => {
            const chartList = await fetchChartList();
            console.log('Got chart list: ', chartList);
            chartList.forEach(chart => {
                const formattedDate = (dayjs.utc(chart.last_date).format('YYYY-MM-DD'));
                dispatch(updateLastDate({chartId: chart.chart_id, chartType: chart.chart_type, lastDate: formattedDate}));
                setDataLoaded(true);
            });
        }
        fetchList();
    }, [dispatch]);

    // useEffect(() => {
    //     console.log('Test');
    //     if (latestChartList)
    //         latestChartList.forEach(chart => {
    //             const formattedDate = (dayjs(chart.last_date).format('YYYY-MM-DD'));
    //             dispatch(updateLastDate({chartId: chart.chart_id, lastDate: formattedDate}));

    //     })
    // }, [latestChartList]);

    return dataLoaded && (
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
