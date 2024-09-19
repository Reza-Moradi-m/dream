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

    // Dummy data for video feed (replace with actual data from backend)
    const videos = [
        {
            id: 1,
            title: "Welcome to Our Website",
            description: "Dream has been number one partner to help you achieve your dream and make it real",
            url: "sample-video-1.mp4",
            comments: [
                { user: "User1", comment: "Great video!" },
                { user: "User2", comment: "Nice work!" }
            ]
        },
        {
            id: 2,
            title: "Sample Video 2",
            description: "This is the second sample video",
            url: "sample-video-2.mp4",
            comments: [
                { user: "User3", comment: "Awesome!" },
                { user: "User4", comment: "Loved it!" }
            ]
        }
    ];

    // Function to display videos in the video feed section
    function displayVideos() {
        const videoFeed = document.getElementById("video-feed");
        videoFeed.innerHTML = ""; // Clear existing content

        videos.forEach(video => {
            const videoElement = document.createElement("div");
            videoElement.classList.add("video");

            videoElement.innerHTML = `
                <video controls>
                    <source src="${video.url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <h2>${video.title}</h2>
                <p>${video.description}</p>
                <h3>Comments</h3>
                <ul>
                    ${video.comments.map(comment => `<li><strong>${comment.user}:</strong> ${comment.comment}</li>`).join("")}
                </ul>
            `;

            videoFeed.appendChild(videoElement);
        });
    }

    // Function to handle form submission for video upload
    function handleUploadForm(event) {
        event.preventDefault();

        const title = document.getElementById("video-title").value;
        const description = document.getElementById("video-description").value;
        const videoFile = document.getElementById("video-file").files[0];

        // Ensure the file exists before proceeding
        if (!videoFile) {
            alert("Please select a video file to upload.");
            return;
        }

        // Upload the video file to the server
        const formData = new FormData();
        formData.append("video-file", videoFile);
        formData.append("title", title);
        formData.append("description", description);

        fetch('/upload-video', {
            method: 'POST',
            body: formData
        })
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload video');
            }
            return response.json();
        })
        .then(data => {
            alert("Video uploaded successfully!");
            console.log("Uploaded video URL:", data.videoUrl);
            // Call function to refresh the video feed or update UI
        })
        .catch(err => {
            console.error("Error uploading video:", err);
            alert("Error uploading video: " + err.message);
        });
    }

    document.getElementById("upload-form").addEventListener("submit", handleUploadForm);

    // Initial display of videos
    displayVideos();

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
            // Redirect to Stripe Checkout
            const result = await stripe.redirectToCheckout({ sessionId: session.id });

            if (result.error) {
                alert(result.error.message);
            }
        } catch (error) {
            console.error("Error initiating payment:", error);
        }
    });
});
