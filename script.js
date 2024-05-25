// Dummy data for video feed (replace with actual data from backend)
const videos = [
    {
        id: 1,
        title: "Sample Video 1",
        description: "This is the first sample video",
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

    // Here you can upload the video file to the server and store its metadata (title, description, etc.)
    // After successful upload, you can update the 'videos' array and call displayVideos() to refresh the video feed
}

document.getElementById("upload-form").addEventListener("submit", handleUploadForm);

// Initial display of videos
displayVideos();
