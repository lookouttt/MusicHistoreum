import { AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import WeekPicker from '../../utils/WeekPicker';
import MonthPicker from '../../utils/MonthPicker';
import YearPicker from '../../utils/YearPicker';
import DecadePicker from '../../utils/DecadePicker';

const TimeFrameMenu = (({bWeekly, firstDate, lastDate}) => {
    let index;
    let timeframes = [];

    if (bWeekly) {
        index = 1;
        timeframes = [
            {tf: "Weekly", picker: <><WeekPicker firstDate={firstDate} lastDate={lastDate}/></>},
            {tf: "Monthly", picker: <><MonthPicker firstDate={firstDate} lastDate={lastDate}/></>},
            {tf: "Yearly", picker: <><YearPicker firstDate={firstDate} lastDate={lastDate}/></>},
            {tf: "Decade", picker: <><DecadePicker firstDate={firstDate} lastDate={lastDate}/></>}
        ];
    } else {
        index = 2;
        timeframes = [
            {tf: "Monthly", picker: <><MonthPicker firstDate={firstDate} lastDate={lastDate}/></>},
            {tf: "Yearly", picker: <><YearPicker firstDate={firstDate} lastDate={lastDate}/></>},
            {tf: "Decade", picker: <><DecadePicker firstDate={firstDate} lastDate={lastDate}/></>}
        ];
    }

    return (
        timeframes.map((timeframe) => {

            return (
                <AccordionItem>
                    <AccordionHeader targetId={String(index)}>
                        {timeframe.tf}
                    </AccordionHeader>
                    <AccordionBody accordionId={String(index++)}>
                        {timeframe.picker}
                    </AccordionBody>
                </AccordionItem> 
            )
        })
    );
});


export default TimeFrameMenu;