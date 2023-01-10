import React from "react";
import { useSelector } from "react-redux";
import { Button } from "reactstrap";
import { selectSpecificChart } from "../chartMenu/chartsMenusSlice";
import WeekPicker from '../../utils/WeekPicker';
import MonthPicker from '../../utils/MonthPicker';
import YearPicker from '../../utils/YearPicker';
import DecadePicker from '../../utils/DecadePicker';

const ChartNav = ({chart}) => {
    const { chartType, chartId, chartTimeframe } = chart;
    const thisChart = useSelector(selectSpecificChart(chartType, chartId));
    let picker;
    switch (chartTimeframe) {
        case 'Week':
            picker = <><WeekPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        case 'Month':
            picker = <><MonthPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        case 'Year':
            picker = <><YearPicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        case 'Decade':
            picker = <><DecadePicker firstDate={thisChart.FirstDate} lastDate={thisChart.LastDate}/></>;
            break;
        default:
            break;     
    }

    return (
        <div>
            <Button>Prev</Button>
            {picker}
            <Button>Next</Button>
        </div>
    );
};

export default ChartNav;