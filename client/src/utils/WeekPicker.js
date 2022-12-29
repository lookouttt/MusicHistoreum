import React, { useState } from 'react';
import { DatePicker } from 'react-datepicker';
import { getDay } from 'date-fns';

export default function MyDatePicker() {
    const [startDate, setStartDate] = useState(new Date());
    return (
      <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
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