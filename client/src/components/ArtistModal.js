import { useState, useMemo, useEffect } from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import Table from './Table';
import ArtistListColumns from "../features/artist/ArtistListColumns";
import ArtistStyles from "../features/artist/ArtistStyles";
import fetchArtistList from "../services/fetchArtistList";
import '../App.css';

const ArtistModal = ({ passChar, resetPassChar }) => {

    const [alphaModalOpen, setAlphaModalOpen] = useState(false);
    const [currentChar, setCurrentChar] = useState(null);
    const [hideResults, setHideResults] = useState(false);

    const openModal = (alphaChar) => {
        console.log('openModal: ', alphaChar);
        setCurrentChar(alphaChar);
        setAlphaModalOpen(true);
    }

    const closeModal = () => {
        setCurrentChar(null);
        setData(null);
        setAlphaModalOpen(false);
        setHideResults(false);
        resetPassChar();
    }

    const columns = useMemo(
        () => ArtistListColumns(), []
    );

    const [data, setData] = useState(null);
    
    useEffect(() => { 
        const fetchData = async () => {
            if (currentChar != null) {
                const charString = `'${currentChar}'`
                console.log('Pre Fetch Artist List: ', charString);
                const artistListData = await fetchArtistList(charString);
                console.log('Post Fetch Artist List ');
                if (artistListData)
                    setData(artistListData);
                else
                    setHideResults(true);

            }
        }
        fetchData();
    }, [currentChar]);

    useEffect (() => {
        if (passChar) {
            openModal(passChar);
        }
    }, [passChar]);

    return (data || hideResults) && (
        <Modal isOpen={alphaModalOpen} className='modalStyle' size='lg'>
            <ModalHeader toggle={() => { setCurrentChar(null);
                                        setData(null);
                                        setAlphaModalOpen(false);
                                        setHideResults(false);
                                        resetPassChar();
            }}>
                Artist List
            </ModalHeader>
            <ModalBody>
                <ArtistStyles>
                    { hideResults ? 'No Artists Found' :
                       <Table 
                            columns={columns} 
                            data={data} 
                            onCloseModal={() => closeModal()} 
                            tablePageSize={20} 
                            bPage={true} 
                            bFilter={true}
                        /> 
                    }
                </ArtistStyles>
            </ModalBody>
        </Modal>
    );
}

export default ArtistModal;