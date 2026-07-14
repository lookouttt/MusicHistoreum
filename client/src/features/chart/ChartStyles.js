import styled from 'styled-components';
import TableStyles from '../../components/TableStyles';

const ChartStyles = styled(TableStyles)`
    padding: 0.2rem;

    table {
        margin-bottom: 10px;
        padding-left: 0.2rem;
        padding-right: 0.2rem;
    }

    .pagination {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        display: flex;
        justify-content: center;
        background-size: cover;
        background-color: rgba(255,255,255,0.3);
    }

    .pagination2 {
        padding-top: 0.1rem;
        padding-bottom: 0.5rem;
        display: flex;
        justify-content: center;
        background-size: cover;
        background-color: rgba(255,255,255,0.3);
    }
`

export default ChartStyles;
