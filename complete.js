document.addEventListener("DOMContentLoaded", () => {
  const encodeProgress = document.getElementById("encodeProgress");
  const saveButton = document.getElementById("saveCapture");
  const closeButton = document.getElementById("close");
  const review = document.getElementById("review");
  const status = document.getElementById("status");
  let format;
  let endpoint;
  let notionSecret;
  let notionPageId;
  let audioURL;
  let encoding = false;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "createTab") {
      format = request.format;
      notionSecret = request.notionSecret;
      notionPageId = request.notionPageId;
      endpoint = request.endpoint;
      let startID = request.startID;
      status.innerHTML = "Please wait...";
      closeButton.onclick = () => {
        chrome.runtime.sendMessage({ cancelEncodeID: startID });
        chrome.tabs.getCurrent((tab) => {
          chrome.tabs.remove(tab.id);
        });
      };

      //if the encoding completed before the page has loaded
      if (request.audioURL) {
        encodeProgress.style.width = "100%";
        status.innerHTML = "File is ready!";
        generateSave(request.audioURL);
      } else {
        encoding = true;
      }
    }

    //when encoding completes
    if (request.type === "encodingComplete" && encoding) {
      encoding = false;
      status.innerHTML = "File is ready!";
      encodeProgress.style.width = "100%";
      generateSave(request.audioURL);
    }
    //updates encoding process bar upon messages
    if (request.type === "encodingProgress" && encoding) {
      encodeProgress.style.width = `${request.progress * 100}%`;
    }
    function generateSave(url) {
      //creates the save button
      const currentDate = new Date(Date.now()).toDateString();
      saveButton.onclick = () => {
        fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
            // Create FormData object
            const formData = new FormData();
            formData.append("file", blob, "audio.mp3");

            // Send HTTP request using fetch
            return fetch(`${endpoint}/upload`, {
              method: "POST",
              body: formData,
            });
          })
          .then((response) => response.json())
          .then((data) => {
            const resultDiv = document.getElementById("result");
            resultDiv.append(data.filename);

            fetch(`${endpoint}/uploadToNotion`, {
              method: "POST",
              headers: new Headers({
                "Content-Type": "application/json",
              }),
              body: JSON.stringify({
                pageId: notionPageId,
                content: data.filename,
                secret: notionSecret,
              }),
            });
          })
          .catch((error) => {
            console.error(error);
          });

        // chrome.downloads.download({
        //   url: url,
        //   filename: `${currentDate}.${format}`,
        //   saveAs: true,
        // });
      };
      saveButton.style.display = "inline-block";
    }
  });
  review.onclick = () => {
    chrome.tabs.create({
      url: "https://chrome.google.com/webstore/detail/chrome-audio-capture/kfokdmfpdnokpmpbjhjbcabgligoelgp/reviews",
    });
  };
});
