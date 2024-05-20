import axios from "axios";
import { load } from "cheerio";
import { writeFile } from "fs/promises";

interface Icon {
  type: "img" | "svg";
  src?: string;
  viewBox?: string;
  paths?: string[];
}

// Function to fetch HTML from a URL and extract attributes
const fetchAndExtractAttributes = async (url: string): Promise<Icon[]> => {
  try {
    const response = await axios.get(url);
    const html = response.data as string;
    saveHtml(html, "downloadedHtml.html");
    return extractAttributes(html);
  } catch (error) {
    console.error("Error fetching the webpage:", error);
    return [];
  }
};

// Function to parse HTML and extract desired attributes
const extractAttributes = (html: string): Icon[] => {
  const $ = load(html);
  const results: Icon[] = [];
  const t = countImgAndSvgOccurrences(html);
  // Extract src from <img> tags
  $("img").each((i, element) => {
    const imgSrc = $(element).attr("src");
    if (imgSrc) {
      results.push({ type: "img", src: imgSrc });
    }
  });

  // Extract viewBox and path from <svg> tags
  $("svg").each((i, element) => {
    const viewBox = $(element).attr("viewBox");
    const paths = $(element)
      .find("path")
      .map((_, el) => $(el).attr("d") ?? "")
      .get();
    if (viewBox || paths.length > 0) {
      results.push({ type: "svg", viewBox, paths });
    }
  });

  return results;
};

// Function to save data to a file
const saveIconsToFile = async (
  icons: Icon[],
  filename: string
): Promise<void> => {
  try {
    const jsonData = JSON.stringify(icons, null, 2);
    await writeFile(filename, jsonData, "utf8");
    console.log(`Successfully saved ${icons.length} icons to file:`, filename);
  } catch (error) {
    console.error("Error saving icons to file:", error);
  }
};

//Debugging functions to make sure there is img/svgs in the html
const countImgAndSvgOccurrences = (
  text: string
): {
  imgCount: number;
  svgCount: number;
} => {
  // Create regular expressions for 'img' and 'svg'
  const imgRegex = /img/gi;
  const svgRegex = /svg/gi;

  // Use match to find all occurrences and count them
  const imgMatches = text.match(imgRegex);
  const svgMatches = text.match(svgRegex);

  // The match method returns null if no matches are found, so check for null before counting
  const imgCount = imgMatches ? imgMatches.length : 0;
  const svgCount = svgMatches ? svgMatches.length : 0;

  return {
    imgCount,
    svgCount,
  };
};

// Convert HTML into a JSON object.
const saveHtmlAsJson = async (html: string): Promise<void> => {
  try {
    const jsonHtml = JSON.stringify(html);
    await writeFile("html", jsonHtml, "utf8");
    console.log("HTML saved as JSON successfully.");
  } catch (error) {
    console.error("Failed to save HTML as JSON:", error);
  }
};

const saveHtml = async (html: string, outputPath: string): Promise<void> => {
  try {
    await writeFile(outputPath, html, "utf8");
    console.log("HTML saved successfully to", outputPath);
  } catch (error) {
    console.error("Failed to save HTML:", error);
  }
};

const websiteUrl = "";
fetchAndExtractAttributes(websiteUrl).then((icons) => {
  console.log("icons:", icons);
  saveIconsToFile(icons, "icons.json");
});
