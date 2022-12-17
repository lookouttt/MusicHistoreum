import { Container } from "reactstrap";
import SubHeader from "../components/SubHeader";
import Hero from '../components/Hero';

const HomePage = () => {
    return (
        <Container>
            <SubHeader current='Home' />
            <Hero />
        </Container>
    );
};

export default HomePage;