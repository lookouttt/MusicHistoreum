import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';

import './App.css';
import WeeklyChartPage from './pages/WeeklyChartPage';


function App() {

    return (
        <div className="App">
            <Header />
            <Routes>
                <Route path='/' element={<HomePage />}/>
                <Route path='/Chart' element={<WeeklyChartPage />}/>
            </Routes>
        </div>
    );
}

export default App;
