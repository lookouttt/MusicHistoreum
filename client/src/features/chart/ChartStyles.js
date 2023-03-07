import styled from 'styled-components';

const ChartStyles= styled.div`
    padding: 1rem;

    table {
        border-spacing: 0;
        border: 1px solid black;
        maxHeight: 30rem;
        overflow: auto;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 10px;
        tr {
            :last-child {
                td {
                    border-bottom: 0;
                }
            }
        }

        tr:nth-child(even) {
            background-color: #8F9AA5;
        }

        tr:nth-child(odd) {
            background-color: white;
        }

        th {
            background-color: #5D8FB5;
            color: white;
            text-align: center;
        }

        th,
        td {
            margin: 0;
            padding: 0.35rem;
            border-bottom: 1px solid black;
            border-right: 1px solid black;

            :last-child {
            border-right: 0;
            }
        }
    }
    .pagination {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        display: flex;
        justify-content: center;
        background-size: cover;
        background-color: rgba(255,255,255,0.3);
    }
`

export default ChartStyles;