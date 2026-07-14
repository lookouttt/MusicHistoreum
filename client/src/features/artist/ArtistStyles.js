import styled from 'styled-components';
import TableStyles from '../../components/TableStyles';

const ArtistStyles = styled(TableStyles)`
    padding: 1rem;

    .pagination {
        padding-top: 1rem;
        display: flex;
        justify-content: center;
    }

    .pagination2 {
        padding-top: 0.2rem;
        display: flex;
        justify-content: center;
    }
`

export default ArtistStyles;
