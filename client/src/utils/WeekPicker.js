import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { getDay, format, parseISO } from 'date-fns';
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

const WeekPicker = () => {
    const [startDate, setStartDate] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isSaturday = (date) => {
      const day = getDay(date);
      return day === 6;
    };

    const onChange = (date) => {
        setStartDate(date);
        const chartDate = format(date, "yyyy-MM-dd");
        console.log('WeekPicker Before: ', chartDate)
        dispatch(updatePendingDate(chartDate));
        console.log('WeekPicker After: ', chartDate);
        dispatch(updateCurrentChart());
        navigate('/Chart');
    }

    return (
        <Styles>
            <DatePicker
                selected={startDate}
                onChange={onChange}
                filterDate={isSaturday}
                placeholderText="Select a chart date"
            />
        </Styles>

    );
  };

  export default WeekPicker;