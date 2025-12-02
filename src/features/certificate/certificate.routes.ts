import { Router } from "express";
import { generateCertificate, generateCertificateForUser, viewCertificate } from "./certificate.controller";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

// POST /certificate/generate  or GET /certificate/generate?token=... (testing via token or name param)
router.post("/generate", generateCertificate);
router.get("/generate", generateCertificate);

// Protected: GET /certificate/generate/user - requires Authorization: Bearer <jwt>
router.get("/generate/user", verifyToken, generateCertificateForUser);

// NEW: Protected view route - opens HTML page with embedded certificate (simple & short!)
// GET /certificate/view or GET /cert/view (via alias in v1.routes)
router.get("/view", verifyToken, viewCertificate);

export default router;
