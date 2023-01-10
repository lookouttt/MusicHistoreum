import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Accordion, AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import SingleChartMenu from './SingleChartMenu';
import { updatePendingType, updatePendingId } from '../chart/chartsSlice';
import './ChartMenu.css';

const ChartMenu = () => {
    const [mainOpen, setMainOpen] = useState(null);
    const dispatch = useDispatch();

    const mainToggle = (id) => {
      if (mainOpen === id) {
        setMainOpen(null);
      } else {
        setMainOpen(id);
        dispatch(updatePendingType(id));
      }
    };

    const [songsOpen, setSongsOpen] = useState(false);
    const songsToggle = (id) => {
      if (songsOpen === id) {
        setSongsOpen();
      } else {
        setSongsOpen(id);
        dispatch(updatePendingId(id));
      }
    };

    const [albumsOpen, setAlbumsOpen] = useState(false);
    const albumsToggle = (id) => {
      if (albumsOpen === id) {
        setAlbumsOpen();
      } else {
        setAlbumsOpen(id);
        dispatch(updatePendingId(id));
      }
    };

    return(
        <Accordion flush open={mainOpen} toggle={mainToggle}>
            <AccordionItem>
                <AccordionHeader targetId='1' id='songHeader'>
                    Song
                </AccordionHeader>
                <AccordionBody accordionId='1' id='songBody'>
                    <Accordion flush open={songsOpen} toggle={songsToggle} id='songAccordion'>
                        <SingleChartMenu chartType='Song'/>
                    </Accordion>
                </AccordionBody>
            </AccordionItem>
            <AccordionItem>
                <AccordionHeader targetId='2' id='albumHeader'>
                    Album
                </AccordionHeader>
                <AccordionBody accordionId='2' id='albumBody'>
                    <Accordion flush open={albumsOpen} toggle={albumsToggle} id='albumAccordion'>
                        <SingleChartMenu chartType='Album'/>
                    </Accordion>
                </AccordionBody>
            </AccordionItem>
        </Accordion>
    )
}

export default ChartMenu;