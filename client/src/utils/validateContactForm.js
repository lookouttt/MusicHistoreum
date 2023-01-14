const validateContactForm = (values) => {
    const errors = {};

    if (values.author.length < 2 || values.author.length > 15) {
        errors.author = 'Must be between 2 and 15 characters long.';
    }

    if (values.commentText.length <= 0) {
         errors.commentText = 'Please enter a comment.';
    }

    return errors;
};

export default validateContactForm;