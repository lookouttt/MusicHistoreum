import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

import HomePage from './pages/HomePage';
import ChartPage from './pages/ChartPage';
import ArtistPage from './pages/ArtistPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';

function App() {
    console.log('This is the beginning');
    return (
        <div className="App">
            <Header />
            <Routes>
                <Route path='/' element={<HomePage />}/>
                <Route path='/Chart' element={<ChartPage />}/>
                <Route path='/Artist' element={<ArtistPage />}/>
                <Route path='/Features' element={<FeaturesPage />}/>
                <Route path='/About' element={<AboutPage />}/>
            </Routes>
            <Footer />
        </div>
    );
}

export default App;
