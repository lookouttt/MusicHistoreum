import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import './App.css';

function App() {
    useEffect(() => {
        fetch("http://localhost:5000/chart/1/Song/Week/1989-11-11")
        .then((response) => response.json())
        .then((actualData) => console.log(actualData))
        .catch((err) => {
            console.log(err.message);
        });
    }, []);
    return (
        <div className="App">
            <Header />
            <Hero />
            <Routes>
                <Route path='/' />
            </Routes>
        </div>
    );
}

export default App;
