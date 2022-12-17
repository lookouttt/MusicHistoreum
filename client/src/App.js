import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import getTestResponse from '../src/services/TestService';
import './App.css';


function App() {
    useEffect(() => {
        getTestResponse();
    }, []);
    return (
        <div className="App">
            <Header />
            <Routes>
                <Route path='/' element={<HomePage />}/>
            </Routes>
        </div>
    );
}

export default App;
