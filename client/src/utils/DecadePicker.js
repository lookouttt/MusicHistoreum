import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { getYear } from 'date-fns';

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

const DecadePicker = () => {
    const [startDate, setStartDate] = useState(null);
    const onChange = (date) => {
        const year = getYear(date);
        const newYear = parseInt(year/10);
        const decade = newYear*10;
        setStartDate(new Date(decade, 0, 1));
    }

    return (
        <Styles>
            <DatePicker
                selected={startDate}
                onChange = {onChange}
                showYearPicker
                dateFormat="yyyy"
                placeholderText="Select year in desired decade"
            />
        </Styles>

    );
  };

  export default DecadePicker;