import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Accordion, AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import { selectChartsMenu } from './chartsMenusSlice';
import TimeFrameMenu from './TimeFrameMenu';
import { updatePendingTimeframe } from '../chart/chartsSlice';
import './SingleChartMenu.css';

const SingleChartMenu = (({chartType}) => {
    const chartList = useSelector(selectChartsMenu(chartType));
    const [chartOpen, setChartOpen] = useState(null);
    const dispatch = useDispatch();


    const chartToggle = (id) => {
      if (chartOpen === id) {
        setChartOpen(null);
      } else {
        setChartOpen(id);
        dispatch(updatePendingTimeframe(id));
      }
    };


    return (
        chartList.map((chart, index) => {
            const bWeekly = (parseInt(chart.ChartId) <= 2) ? true : false;

            return (
                <AccordionItem key={index}>
                    <AccordionHeader targetId={String(chart.ChartId)} className='chartMenuHeader'>
                        {chart.ChartTitle}
                    </AccordionHeader>
                    <AccordionBody accordionId={String(chart.ChartId)} className='chartMenuBody'>
                        <Accordion flush open={chartOpen} toggle={chartToggle}>
                            <TimeFrameMenu bWeekly={bWeekly} firstDate={chart.FirstDate} lastDate={chart.LastDate}/>
                        </Accordion>
                    </AccordionBody>
                </AccordionItem>
            )
        })
    );
});

export default SingleChartMenu;