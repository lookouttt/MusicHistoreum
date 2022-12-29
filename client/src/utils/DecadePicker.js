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
    const isDecade = (date) => {
      const year = getYear(date);
      return year%10 === 0;
    };
    return (
        <Styles>
            <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showYearPicker
                dateFormat="yyyy"
                filterDate={isDecade}
            />
        </Styles>

    );
  };

  export default DecadePicker;