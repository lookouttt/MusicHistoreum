import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { getYear, format } from 'date-fns';
import { updateCurrentChart, updatePendingDate } from '../features/chart/chartsSlice';

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
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onChange = (date) => {
        const year = getYear(date);
        const newYear = parseInt(year/10);
        const decade = newYear*10;
        setStartDate(new Date(decade, 0, 1));
        const chartDate = format(startDate, "yyyy-MM-dd");
        console.log('WeekPicker Before: ', chartDate);
        dispatch(updatePendingDate(chartDate));
        console.log('WeekPicker After: ', chartDate);
        dispatch(updateCurrentChart());
        navigate('/Chart');
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