import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../../models/response";
import { generateCertificateService } from "./certificate.service";
import prisma from "../../database/database";
import { AuthRequest } from "../../middleware/verifyToken";
import { APIError } from "../../middleware/errorHandler";

export const generateCertificate = async (
  req: Request,
  res: Response<APIResponse | any>,
  next: NextFunction,
) => {
  try {
    const token = (req.body && req.body.token) || req.query.token;
    const name = req.body?.name || req.query.name || "";
    const course = req.body?.course || req.query.course || "";

    const expected = process.env.CERT_TOKEN || "TEST_CERT_TOKEN";
    if (token && token !== expected) {
      throw new APIError("Invalid certificate token", 401);
    }

    const pngBuffer = await generateCertificateService(name, course);

    const format = (req.query.format as string) || "binary";
    if (format === "base64") {
      const base64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;
      return res.status(200).json({ status: "success", message: "Certificate generated", data: { image: base64 } });
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename=certificate.png`);
    return res.status(200).send(pngBuffer);
  } catch (err) {
    next(err);
  }
};

export const generateCertificateForUser = async (
  req: AuthRequest,
  res: Response<APIResponse | any>,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      throw new APIError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
    if (!user) {
      throw new APIError("User not found", 404);
    }

    const course = req.query.course as string || req.body?.course || "";

    const pngBuffer = await generateCertificateService(user.full_name, course);

    const format = (req.query.format as string) || "binary";
    if (format === "base64") {
      const base64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;
      return res.status(200).json({ status: "success", message: "Certificate generated", data: { image: base64 } });
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename=certificate_${userId}.png`);
    return res.status(200).send(pngBuffer);
  } catch (err) {
    next(err);
  }
};


export const viewCertificate = async (
  req: AuthRequest,
  res: Response<APIResponse | any>,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      throw new APIError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
    if (!user) {
      throw new APIError("User not found", 404);
    }

    const course = req.query.course as string || req.body?.course || "";

    const pngBuffer = await generateCertificateService(user.full_name, course);
    const base64 = pngBuffer.toString("base64");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>My Certificate</title>
        <style>
          body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; font-family: Arial, sans-serif; }
          .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 100%; }
          h1 { color: #333; margin-top: 0; }
          img { max-width: 100%; height: auto; margin: 20px 0; border-radius: 4px; }
          .actions { margin-top: 20px; }
          button { padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin: 0 5px; }
          button:hover { background: #4338ca; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>My Certificate</h1>
          <img src="data:image/png;base64,${base64}" alt="Certificate">
          <div class="actions">
            <button onclick="downloadCert()">Download</button>
            <button onclick="window.print()">Print</button>
          </div>
        </div>
        <script>
          function downloadCert() {
            const link = document.createElement('a');
            link.href = 'data:image/png;base64,${base64}';
            link.download = 'certificate.png';
            link.click();
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
};
