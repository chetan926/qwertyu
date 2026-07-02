import { type IRouter, Router } from "express";
import multer from "multer";
import { analyzeDocument } from "../controllers/plagiarism-controller";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/plagiarism/analyze-document
router.post("/analyze-document", upload.single("document"), analyzeDocument);

export { router as plagiarismRouter };
