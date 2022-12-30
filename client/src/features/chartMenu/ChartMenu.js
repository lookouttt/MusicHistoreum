import { useState } from 'react';
import { Accordion, AccordionBody, AccordionItem, AccordionHeader } from 'reactstrap';
import SingleChartMenu from './SingleChartMenu';

const ChartMenu = () => {
    const [mainOpen, setMainOpen] = useState(false);

    const mainToggle = (id) => {
      if (mainOpen === id) {
        setMainOpen();
      } else {
        setMainOpen(id);
      }
    };

    const [songsOpen, setSongsOpen] = useState(false);
    const songsToggle = (id) => {
      if (songsOpen === id) {
        setSongsOpen();
      } else {
        setSongsOpen(id);
      }
    };

    const [albumsOpen, setAlbumsOpen] = useState(false);
    const albumsToggle = (id) => {
      if (albumsOpen === id) {
        setAlbumsOpen();
      } else {
        setAlbumsOpen(id);
      }
    };

    return(
        <Accordion flush open={mainOpen} toggle={mainToggle}>
            <AccordionItem>
                <AccordionHeader targetId='1'>
                    Song
                </AccordionHeader>
                <AccordionBody accordionId='1'>
                    <Accordion flush open={songsOpen} toggle={songsToggle}>
                        <SingleChartMenu chartType='Song'/>
                    </Accordion>
                </AccordionBody>
            </AccordionItem>
            <AccordionItem>
                <AccordionHeader targetId='2'>
                    Album
                </AccordionHeader>
                <AccordionBody accordionId='2'>
                    <Accordion flush open={albumsOpen} toggle={albumsToggle}>
                        <SingleChartMenu chartType='Album'/>
                    </Accordion>
                </AccordionBody>
            </AccordionItem>
        </Accordion>
    )
}

export default ChartMenu;