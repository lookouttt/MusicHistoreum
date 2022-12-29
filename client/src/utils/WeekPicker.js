import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { getDay } from 'date-fns';

const Styles = styled.div`
  .react-datepicker-wrapper,
  .react-datepicker__input-container,
  .react-datepicker__input-container input {
    width: 175px;
  }

  .react-datepicker__close-icon::before,
  .react-datepicker__close-icon::after {
    background-color: grey;
  }
`;

export default function MyDatePicker() {
    const [startDate, setStartDate] = useState(new Date());
    return (
        <Styles>
            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
        </Styles>

    );
  };

// const WeekPicker = () => {
//     const [startDate, setStartDate] = useState(null);
//     const isSaturday = (date) => {
//       const day = getDay(date);
//       return day === 6;
//     };
//     return (
//       <DatePicker
//         selected={startDate}
//         onChange={(date) => setStartDate(date)}
//         filterDate={isSaturday}
//         placeholderText="Select a chart date"
//       />
//     );
//   };

//   export default WeekPicker;