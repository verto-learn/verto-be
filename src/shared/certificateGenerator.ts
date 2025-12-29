import { registerFont, createCanvas, loadImage } from "canvas";
import path from "path";

// Opsional: Register font custom jika mau (misal Poppins/Montserrat)
// registerFont(path.join(__dirname, "../assets/fonts/Poppins-Bold.ttf"), { family: "Poppins" });

export const generateCertificateImage = async (
  userName: string,
  courseName: string,
  certificateId: string
): Promise<Buffer> => {
  const templatePath = path.join(__dirname, "../assets/certificate-template.jpg"); // Sesuaikan path
  
  // Load gambar
  const image = await loadImage(templatePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // 1. Gambar Template
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // 2. Setup Style Umum (Warna Hitam/Gelap sesuai desain)
  ctx.fillStyle = "#333333"; 
  ctx.textAlign = "center"; 

  // --- KOORDINAT (Sesuaikan X dan Y dengan desain asli Anda) ---
  // Gunakan trial & error atau software editing gambar untuk cari koordinat pixel

  // A. No. Registrasi (Certificate ID)
  ctx.font = "bold 24px Arial";
  ctx.fillText(certificateId, image.width / 2, 380); // Y=380 adalah contoh posisi vertikal

  // B. Nama User (Diberikan kepada)
  ctx.font = "bold 60px Arial"; // Font besar
  ctx.fillText(userName, image.width / 2, 550); 

  // C. Nama Course
  ctx.font = "40px Arial";
  ctx.fillText(courseName, image.width / 2, 750); 

  // Return sebagai Buffer (binary data)
  return canvas.toBuffer("image/jpeg");
};