import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { APIError } from "../../middleware/errorHandler";

// Compose the user's name and course onto the certificate template using an SVG overlay.
export const generateCertificateService = async (
  name: string,
  course?: string,
) => {
  const assetsPath = path.join(__dirname, "../../../assets", "certificate.png");

  let templateBuffer: Buffer;
  try {
    templateBuffer = await fs.readFile(assetsPath);
  } catch (err) {
    throw new APIError("Failed to read certificate template", 500);
  }

  // Use sharp to get metadata so SVG overlay matches template size
  const meta = await sharp(templateBuffer).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 675;

  const displayName = (name || "Participant").toString();
  const displayCourse = course ? course.toString() : "";

  const svg = `
  <svg width="${width}" height="${height}">
    <style>
      .name { fill: #0b1220; font-size: ${Math.round(width / 18)}px; font-weight: 700; font-family: Arial, Helvetica, sans-serif; }
      .course { fill: #253047; font-size: ${Math.round(width / 32)}px; font-weight: 500; font-family: Arial, Helvetica, sans-serif; }
    </style>
    <g text-anchor="middle">
      <text x="${Math.round(width / 2)}" y="${Math.round(height * 0.48)}" class="name">${escapeXml(displayName)}</text>
      <text x="${Math.round(width / 2)}" y="${Math.round(height * 0.58)}" class="course">${escapeXml(displayCourse)}</text>
    </g>
  </svg>`;

  try {
    const output = await sharp(templateBuffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return output;
  } catch (err) {
    console.error("compose error", err);
    throw new APIError("Failed to compose certificate image", 500);
  }
};

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'\"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
