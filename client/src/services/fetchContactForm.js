import { baseUrl } from "./baseUrl";

async function fetchContactForm(formData) {
    const response = await fetch(`${baseUrl}contact`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    if (!response.ok) {
        throw new Error(`Contact form request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'Message Sent') {
        throw new Error('Contact form submission failed');
    }

    return data;
}

export default fetchContactForm;