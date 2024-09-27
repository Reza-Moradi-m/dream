// script.js

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const signInBtn = document.getElementById('sign-in');
    const signUpBtn = document.getElementById('sign-up');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-title');
    const authButton = document.getElementById('auth-button');

    const showModal = (isSignUp) => {
        modalTitle.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        authButton.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        modal.style.display = 'flex';
    };

    signInBtn.addEventListener('click', () => showModal(false));
    signUpBtn.addEventListener('click', () => showModal(true));

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    document.getElementById('auth-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const isSignUp = authButton.textContent === 'Sign Up';
        
        const response = await fetch(`/auth/${isSignUp ? 'register' : 'login'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            modal.style.display = 'none';
        } else {
            alert(result.error);
        }
    });

    // Function to handle form submission for video upload
    async function handleUploadForm(event) {
        event.preventDefault();

        const title = document.getElementById("video-title").value;
        const description = document.getElementById("video-description").value;
        const videoFile = document.getElementById("video-file").files[0];

        if (!videoFile) {
            alert("Please select a video file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("video-file", videoFile);
        formData.append("title", title);
        formData.append("description", description);

        try {
            const response = await fetch('/upload-video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload video');
            }

            const data = await response.json();
            alert("Video uploaded successfully!");

            // Append the uploaded video to the video feed dynamically
            const videoFeed = document.getElementById('video-feed');
            const videoElement = document.createElement('div');
            videoElement.classList.add("video");
            videoElement.innerHTML = `
                <video width="320" height="240" controls>
                    <source src="${data.videoUrl}" type="video/mp4">
                </video>
                <h2>${title}</h2>
                <p>${description}</p>
            `;
            videoFeed.appendChild(videoElement);
        } catch (err) {
            console.error("Error uploading video:", err);
            alert("Error uploading video: " + err.message);
        }
    }

    document.getElementById("upload-form").addEventListener("submit", handleUploadForm);

    // Stripe Integration for Payment
    const stripe = Stripe('pk_live_51PxnnvRtwuLdHUxMIYpyt18ZDI6R6KL9NeFkkQz0zIXBNZQ34AhXfQ8fCUhfjv7ALnZIC6c3RpEpy2y24goHYF6000mXx71j');
    const checkoutButton = document.getElementById("checkout-button");

    checkoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: 1 }) // Replace with actual user ID
            });

            const session = await response.json();
            const result = await stripe.redirectToCheckout({ sessionId: session.id });

            if (result.error) {
                alert(result.error.message);
            }
        } catch (error) {
            console.error("Error initiating payment:", error);
        }
    });
});
