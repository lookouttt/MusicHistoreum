const validateContactForm = (values) => {
    const errors = {};

    if (values.firstName.length < 2 || values.firstName.length > 30) {
        errors.firstName = 'Must be between 2 and 30 characters long.';
    }

    if (values.lastName.length < 2 || values.lastName.length > 40) {
        errors.lastName = 'Must be between 2 and 40 characters long.';
    }

    if (!values.email) {
        errors.email = 'Required'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
        errors.email = 'Invalid email address'
    }

    if (values.commentText.length <= 0) {
         errors.commentText = 'Please enter a comment.';
    }

    return errors;
};

export default validateContactForm;