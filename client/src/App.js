import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import './App.css';

function App() {
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
