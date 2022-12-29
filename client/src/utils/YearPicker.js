import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";

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

const YearPicker = () => {
    const [startDate, setStartDate] = useState(new Date());
    return (
        <Styles>
            <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showYearPicker
                dateFormat="yyyy"
            />
        </Styles>

    );
  };

export default YearPicker;