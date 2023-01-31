import { useState, useMemo, useEffect } from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import Table from './Table';
import ArtistListColumns from "../features/artist/ArtistListColumns";
import ArtistStyles from "../features/artist/ArtistStyles";
import fetchArtistList from "../services/fetchArtistList";

const ArtistModal = ({ passChar }) => {

    const [ alphaModalOpen, setAlphaModalOpen] = useState(false);
    const [ currentChar, setCurrentChar] = useState(null);

    const openModal = (alphaChar) => {
        console.log('openModal: ', alphaChar);
        setCurrentChar(alphaChar);
        setAlphaModalOpen(true);
    }

    const closeModal = () => {
        setCurrentChar(null);
        setAlphaModalOpen(false);
    }

    const columns = useMemo(
        () => ArtistListColumns(), []
    );

    const [data, setData] = useState([]);
    
    useEffect(() => { 
        const fetchData = async () => {
            if (currentChar != null) {
                const charString = `'${currentChar}'`
                console.log('Pre Fetch Artist List: ', charString);
                const artistListData = await fetchArtistList(charString);
                console.log('Post Fetch Artist List ');
                setData(artistListData);
            }
        }
        fetchData();
    }, [currentChar]);

    useEffect (() => {
        if (passChar) {
            openModal(passChar);
        }
    }, [passChar]);

    return (
        <Modal isOpen={alphaModalOpen}>
            <ModalHeader toggle={() => { setCurrentChar(null);
                                        setAlphaModalOpen(false);
            }}>
                Artist List
            </ModalHeader>
            <ModalBody>
                <ArtistStyles>
                    <Table columns={columns} data={data} onCloseModal={() => closeModal()} />
                </ArtistStyles>
            </ModalBody>
        </Modal>
    );
}

export default ArtistModal;