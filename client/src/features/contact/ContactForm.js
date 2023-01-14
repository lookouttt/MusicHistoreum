import { useState} from 'react';
// import { useDispatch } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import validateContactForm from '../../utils/validateContactForm';
// import { postComment } from './commentsSlice';


const ContactForm = () => {
    const [modalOpen, setModalOpen] = useState(false);

    // const dispatch = useDispatch();

    const handleSubmit = (values) => {
        const comment = {
            author: values.author,
            text: values.commentText,
            date: new Date(Date.now()).toISOString()
        };
        console.log("comment: ", comment);
        // dispatch(postComment(comment));
        setModalOpen(false);
    };

    return (
        <>
            <span className='navbar-text ml-auto'>
                <Button color='light' onClick={() => setModalOpen(true)}
                >
                    <i className='fa fa-comment' /> Contact
                </Button>
            </span>
            <Modal isOpen={modalOpen}>
                <ModalHeader toggle={() => setModalOpen(false)}>
                    Add Comment
                </ModalHeader>
                <ModalBody>
                    <Formik 
                        initialValues={
                            {
                                author: '',
                                commentText: ''
                            }
                        }
                        onSubmit={handleSubmit}
                        validate={validateContactForm}
                        >
                        <Form>
                            <FormGroup>
                                <Label htmlFor='author'>Your Name</Label>

                                <Field
                                    name='author'
                                    placeholder='Your Name'
                                    className='form-control'
                                />
                                <ErrorMessage name='author'>
                                    {(msg) => <p className='text-danger'>{msg}</p>} 
                                </ErrorMessage>       
                            </FormGroup>                         
                            <FormGroup>
                                <Label htmlFor='commentText'>Comment</Label>
                                <Field
                                name='commentText'
                                as='textarea'
                                rows='12'
                                className='form-control'
                                />
                                <ErrorMessage name='commentText'>
                                    {(msg) => <p className='text-danger'>{msg}</p>} 
                                </ErrorMessage>         
                            </FormGroup>

                            <Button type='submit' color='primary'>
                                Submit
                            </Button>
                        </Form>
                    </Formik>
                </ModalBody>

            </Modal>
        </>
    );
};

export default ContactForm;