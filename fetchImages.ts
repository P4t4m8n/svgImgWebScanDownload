import axios from "axios";
import { load } from "cheerio";
import { createWriteStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { basename, resolve } from "path";

// Function to download images directly from imageUrl found in the HTML content
async function downloadImagesFromHTMLContent(
  url: string,
  downloadFolder: string
): Promise<void> {
  try {
    const response = await axios.get(url);
    const html = response.data;

    // Regex to find all occurrences of imageUrl along with an optional title
    const imageUrlTitleRegex =
      /"imageUrl":"(https:\/\/[^"]+)","title":"([^"]*)"/g;
    let match;
    while ((match = imageUrlTitleRegex.exec(html)) !== null) {
      const imageUrl = match[1];
      let title = match[2];
      if (!title) {
        // If title is empty or not found, use a random number
        title = Math.floor(Math.random() * 1000000).toString();
      }
      await downloadImage(imageUrl, title, downloadFolder);
    }
  } catch (error) {
    console.error(`Could not fetch or parse the page: ${error}`);
  }
}

// Function to download an image given a URL and save it with the provided title as the filename
async function downloadImage(
  url: string,
  title: string,
  folder: string
): Promise<void> {
  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    // Normalize title to create a valid filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const fileName = `${safeTitle}.jpg`;
    const outputPath = resolve(folder, fileName);

    const writer = response.data.pipe(createWriteStream(outputPath));

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Could not download the image: ${error}`);
  }
}

const saveHtml = async (html: string, outputPath: string): Promise<void> => {
  try {
    await writeFile(outputPath, html, "utf8");
    console.log("HTML saved successfully to", outputPath);
  } catch (error) {
    console.error("Failed to save HTML:", error);
  }
};
// Function to ensure directory exists
async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
    console.log(`Directory ${dir} is ready.`);
  } catch (error) {
    if (error !== "EEXIST") {
      throw error; // throws error if any other error than "already exists" occurs
    }
  }
}

let website = "https://www.airbnb.com/";
let downloadFolder = "./downloaded_images";
ensureDirectoryExists(downloadFolder)
  .then(() => {
    downloadImagesFromHTMLContent(website, downloadFolder);
  })
  .catch((error) => {
    console.error("Error creating directory:", error);
  });
