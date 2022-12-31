import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { format } from 'date-fns';
import { updatePendingDate, updateCurrentChart } from '../features/chart/chartsSlice';

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

const MonthPicker = () => {
    const [startDate, setStartDate] = useState(new Date());
    const dispatch = useDispatch();
    const navigate = useNavigate();

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
                dateFormat="MM/yyyy"
                showMonthYearPicker
                showFullMonthYearPicker
                placeholderText="Select a month"
            />
        </Styles>

    );
  };

export default MonthPicker;