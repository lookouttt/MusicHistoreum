import { useState } from 'react';
import { DatePicker } from 'react-datepicker';
import { getYear } from 'date-fns';

const DecadePicker = () => {
    const [startDate, setStartDate] = useState(null);
    const isDecade = (date) => {
      const year = getYear(date);
      return year%10 === 0;
    };
    return (
      <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        showYearPicker
        dateFormat="yyyy"
        filterDate={isDecade}
      />
    );
  };

  export default DecadePicker;